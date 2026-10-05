// Study material service: CRUD with file lifecycle (temp -> permanent -> cleanup) and cache invalidation.
import { randomUUID } from 'crypto';
import { and, desc, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db, schema } from '@/db';
import {
  CACHE_TAGS,
  NotFoundError,
  ValidationError,
  parseMaterialInput,
  slugify,
  toAdminMaterial,
  type MaterialInput,
} from './content';
import { commitImage, commitPdf, deleteStoredFile } from './storage';

type MaterialRow = typeof schema.materials.$inferSelect;
export type AdminMaterialDTO = ReturnType<typeof toAdminMaterial>;

const T = schema.materials;

function invalidatePublic() {
  revalidateTag(CACHE_TAGS.materials);
}

const fileRefsOf = (r: Pick<MaterialRow, 'coverImage' | 'samplePages' | 'fileUrl'>) =>
  [r.coverImage, ...(r.samplePages || []), r.fileUrl].filter((x): x is string => !!x);

async function getRow(id: string): Promise<MaterialRow> {
  const [row] = await db.select().from(T).where(eq(T.id, id));
  if (!row) throw new NotFoundError('Material not found');
  return row;
}

/** Delete files no longer used by `excludeId` and not referenced by any other material (duplicates share files). */
async function cleanupFiles(refs: string[], excludeId: string) {
  if (!refs.length) return;
  const others = await db
    .select({ coverImage: T.coverImage, samplePages: T.samplePages, fileUrl: T.fileUrl })
    .from(T)
    .where(ne(T.id, excludeId));
  const stillUsed = new Set(others.flatMap(fileRefsOf));
  await Promise.all(refs.filter((r) => !stillUsed.has(r)).map(deleteStoredFile));
}

async function uniqueSlug(requested: string | null, titleEn: string, id: string): Promise<string> {
  if (requested) {
    const [clash] = await db.select({ id: T.id }).from(T).where(and(eq(T.slug, requested), ne(T.id, id)));
    if (clash) throw new ValidationError(`The URL slug "${requested}" is already used by another material`);
    return requested;
  }
  const base = slugify(titleEn) || id;
  const [clash] = await db.select({ id: T.id }).from(T).where(and(eq(T.slug, base), ne(T.id, id)));
  return clash ? `${base}-${id.replace(/^mat-/, '')}` : base;
}

/** Move fresh uploads into permanent storage and return the values to persist. */
async function commitFiles(input: MaterialInput) {
  const coverImage = await commitImage(input.coverImage);
  const samplePages = await Promise.all(input.samplePages.map(commitImage));
  const fileUrl = await commitPdf(input.fileUrl);
  return {
    coverImage,
    samplePages,
    fileUrl,
    // Clear file metadata when the PDF is removed
    fileName: fileUrl ? input.fileName : null,
    fileSize: fileUrl ? input.fileSize : null,
  };
}

// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

export async function listMaterials(): Promise<AdminMaterialDTO[]> {
  const rows = await db.select().from(T).orderBy(asc(T.sortOrder), desc(T.createdAt));
  return rows.map(toAdminMaterial);
}

export async function getMaterial(id: string): Promise<MaterialRow> {
  return getRow(id);
}

// -------------------------------------------------------------------------
// Mutations
// -------------------------------------------------------------------------

export async function createMaterial(body: Record<string, unknown>): Promise<AdminMaterialDTO> {
  const input = parseMaterialInput(body);
  const id = `mat-${randomUUID().slice(0, 8)}`;
  const slug = await uniqueSlug(input.slug, input.title.en, id);
  const files = await commitFiles(input);

  await db.insert(T).values({ ...input, ...files, id, slug });
  invalidatePublic();
  return toAdminMaterial(await getRow(id));
}

/** Partial update: the patch is merged over the current record and the whole result is re-validated. */
export async function updateMaterial(id: string, patch: Record<string, unknown>): Promise<AdminMaterialDTO> {
  const existing = await getRow(id);
  const current = toAdminMaterial(existing);
  const input = parseMaterialInput({ ...current, rating: current.rating, ...patch });
  const slug = await uniqueSlug(input.slug ?? existing.slug, input.title.en, id);
  const files = await commitFiles(input);

  await db.update(T).set({ ...input, ...files, slug }).where(eq(T.id, id));

  const newRefs = new Set(fileRefsOf(files));
  await cleanupFiles(fileRefsOf(existing).filter((r) => !newRefs.has(r)), id);

  invalidatePublic();
  return toAdminMaterial(await getRow(id));
}

/** Deletes a material and its files. Purchased materials are unpublished instead to keep order history valid. */
export async function deleteMaterial(id: string): Promise<{ archived: boolean }> {
  const existing = await getRow(id);
  const [purchased] = await db
    .select({ id: schema.orderItems.id })
    .from(schema.orderItems)
    .where(eq(schema.orderItems.materialId, id))
    .limit(1);

  if (purchased) {
    await db.update(T).set({ isPublished: false }).where(eq(T.id, id));
    invalidatePublic();
    return { archived: true };
  }

  await db.delete(T).where(eq(T.id, id));
  await cleanupFiles(fileRefsOf(existing), id);
  invalidatePublic();
  return { archived: false };
}

/** Creates an unpublished copy (shares files with the original until either is changed). */
export async function duplicateMaterial(id: string): Promise<AdminMaterialDTO> {
  const src = await getRow(id);
  const newId = `mat-${randomUUID().slice(0, 8)}`;
  const title = { ...src.title, en: `${src.title.en} (Copy)` };
  const slug = await uniqueSlug(null, title.en, newId);
  const { createdAt: _c, updatedAt: _u, ...rest } = src;
  void _c;
  void _u;
  await db.insert(T).values({ ...rest, id: newId, slug, title, isPublished: false, downloadCount: 0 });
  invalidatePublic();
  return toAdminMaterial(await getRow(newId));
}

export type BulkAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete';

export async function bulkUpdateMaterials(ids: string[], action: BulkAction) {
  if (!ids.length) throw new ValidationError('Select at least one material');
  if (ids.length > 200) throw new ValidationError('Too many items selected');

  if (action === 'delete') {
    const results = [];
    for (const id of ids) {
      try {
        results.push({ id, ...(await deleteMaterial(id)) });
      } catch (err) {
        if (!(err instanceof NotFoundError)) throw err;
      }
    }
    return { affected: results.length, archived: results.filter((r) => r.archived).map((r) => r.id) };
  }

  const set =
    action === 'publish' ? { isPublished: true }
    : action === 'unpublish' ? { isPublished: false }
    : action === 'feature' ? { featured: true }
    : { featured: false };
  await db.update(T).set(set).where(inArray(T.id, ids));
  invalidatePublic();
  return { affected: ids.length, archived: [] as string[] };
}

export async function incrementDownloads(id: string) {
  await db.update(T).set({ downloadCount: sql`${T.downloadCount} + 1` }).where(eq(T.id, id));
}
