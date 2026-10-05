// Server-side content access: DB rows <-> frontend types, plus input validation for admin writes.
import { asc, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db, schema } from '@/db';
import type { ExamUpdate, Product, UpdateBadge, UpdateCategory } from '@/lib/types';
import {
  EXAM_OPTIONS,
  LANGUAGE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  SUBJECT_OPTIONS,
  UPDATE_BADGE_OPTIONS,
  UPDATE_CATEGORY_OPTIONS,
} from '@/lib/adminOptions';
import { isStoredImageRef, isStoredPdfRef, isTempRef } from './storage';

/** Cache tags. Admin writes call revalidateTag() so the public site updates immediately. */
export const CACHE_TAGS = { materials: 'materials', examUpdates: 'exam-updates' } as const;

type MaterialRow = typeof schema.materials.$inferSelect;
type UpdateRow = typeof schema.examUpdates.$inferSelect;
type Localized = { mr: string; en: string; hi: string };

// -------------------------------------------------------------------------
// Row -> frontend type mappers
// -------------------------------------------------------------------------

const fillLocalized = (v: { mr?: string; en?: string; hi?: string } | null | undefined): Localized => {
  const en = v?.en || v?.mr || v?.hi || '';
  const mr = v?.mr || en;
  return { mr, en, hi: v?.hi || mr };
};

export function toProduct(r: MaterialRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    title: fillLocalized(r.title),
    subtitle: r.subtitle ? fillLocalized(r.subtitle) : undefined,
    description: fillLocalized(r.description),
    exam: r.exam as Product['exam'],
    subject: r.subject as Product['subject'],
    language: r.language,
    materialType: r.materialType as Product['materialType'],
    coverImage: r.coverImage,
    samplePages: r.samplePages,
    pages: r.pages,
    originalPrice: r.originalPrice,
    discountedPrice: r.discountedPrice,
    rating: Number(r.rating),
    reviewsCount: r.reviewsCount,
    lastUpdated: r.lastUpdatedLabel || '',
    featured: r.featured,
    bestseller: r.bestseller,
    isFree: r.isFree,
    fileSize: r.fileSize || '',
    tableOfContents: r.tableOfContents,
    whatIsIncluded: r.whatIsIncluded,
    tags: r.tags,
    hasFile: !!r.fileUrl,
    downloadCount: r.downloadCount,
  };
}

export function toExamUpdate(r: UpdateRow): ExamUpdate {
  return {
    id: r.id,
    slug: r.slug,
    title: fillLocalized(r.title),
    exam: r.exam as ExamUpdate['exam'],
    category: r.category as UpdateCategory,
    badge: r.badge,
    publishedDate: r.publishedLabel,
    lastDate: r.lastDateLabel || undefined,
    examDate: r.examDateLabel || undefined,
    shortSummary: fillLocalized(r.shortSummary),
    fullContent: fillLocalized(r.fullContent),
    officialLink: r.officialLink,
    syllabusLink: r.syllabusLink || undefined,
  };
}

/** Admin view includes private file info, publish flag, ordering and stats. */
export function toAdminMaterial(r: MaterialRow) {
  return {
    ...toProduct(r),
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    isPublished: r.isPublished,
    sortOrder: r.sortOrder,
    downloadCount: r.downloadCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function toAdminUpdate(r: UpdateRow) {
  return { ...toExamUpdate(r), isPublished: r.isPublished, createdAt: r.createdAt };
}

// -------------------------------------------------------------------------
// Public read queries (published only). Cached; invalidated by admin writes via tags.
// -------------------------------------------------------------------------

export const getPublishedMaterials = unstable_cache(
  async (): Promise<Product[]> => {
    const rows = await db
      .select()
      .from(schema.materials)
      .where(eq(schema.materials.isPublished, true))
      .orderBy(asc(schema.materials.sortOrder), desc(schema.materials.createdAt));
    return rows.map(toProduct);
  },
  ['public-materials'],
  { tags: [CACHE_TAGS.materials], revalidate: 300 }
);

export const getPublishedExamUpdates = unstable_cache(
  async (): Promise<ExamUpdate[]> => {
    const rows = await db
      .select()
      .from(schema.examUpdates)
      .where(eq(schema.examUpdates.isPublished, true))
      .orderBy(desc(schema.examUpdates.createdAt));
    return rows.map(toExamUpdate);
  },
  ['public-exam-updates'],
  { tags: [CACHE_TAGS.examUpdates], revalidate: 300 }
);

// -------------------------------------------------------------------------
// Validation helpers for admin input
// -------------------------------------------------------------------------

export class ValidationError extends Error {}
export class NotFoundError extends Error {}
/** Error with an explicit HTTP status (e.g. 403 attempt limit, 409 quiz not live). */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const MATERIAL_LANGUAGES = LANGUAGE_OPTIONS as Product['language'][];
export const MATERIAL_TYPES = MATERIAL_TYPE_OPTIONS;
export const UPDATE_CATEGORIES = UPDATE_CATEGORY_OPTIONS as UpdateCategory[];
export const UPDATE_BADGES = UPDATE_BADGE_OPTIONS as UpdateBadge[];

type Obj = Record<string, unknown>;

function str(o: Obj, key: string, { required = false, max = 255 } = {}): string {
  const v = o[key];
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  if (required && !s) throw new ValidationError(`${key} is required`);
  if (s.length > max) throw new ValidationError(`${key} must be at most ${max} characters`);
  return s;
}

function int(o: Obj, key: string, { min = 0, max = 1_000_000, fallback }: { min?: number; max?: number; fallback?: number } = {}) {
  const v = o[key];
  if ((v === undefined || v === '' || v === null) && fallback !== undefined) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`${key} must be a whole number between ${min} and ${max}`);
  }
  return n;
}

function bool(o: Obj, key: string): boolean {
  return o[key] === true || o[key] === 'true';
}

function oneOf<T extends string>(o: Obj, key: string, allowed: readonly T[], fallback?: T): T {
  const v = str(o, key);
  if (!v && fallback) return fallback;
  if (!(allowed as readonly string[]).includes(v)) {
    throw new ValidationError(`${key} must be one of: ${allowed.join(', ')}`);
  }
  return v as T;
}

/** Localized field: accepts { en, mr, hi }. At least one language is required when `required`. */
function localized(o: Obj, key: string, { required = false, max = 500 } = {}): Localized | null {
  const raw = (o[key] ?? {}) as Obj;
  const v = {
    en: str(raw, 'en', { max }),
    mr: str(raw, 'mr', { max }),
    hi: str(raw, 'hi', { max }),
  };
  if (!v.en && !v.mr && !v.hi) {
    if (required) throw new ValidationError(`${key} is required (at least one language)`);
    return null;
  }
  return fillLocalized(v);
}

function stringList(o: Obj, key: string, { maxItems = 50, maxLen = 255 } = {}): string[] {
  const v = o[key];
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [];
  return list
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((x) => x.slice(0, maxLen));
}

/** Only allow https URLs or files served by our own media route (blocks javascript:, data:, etc.). */
function safeUrl(o: Obj, key: string, { required = false } = {}): string {
  const v = str(o, key, { required, max: 512 });
  if (!v) return '';
  if (v.startsWith('/api/media/') || v.startsWith('/images/')) return v;
  try {
    const u = new URL(v);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch {
    /* fall through */
  }
  throw new ValidationError(`${key} must be an http(s) URL or an uploaded file`);
}

/** Image: a fresh upload ("temp/..."), a stored image, a bundled /images/ asset, or an external https URL. */
function imageRef(value: unknown, key: string, { required = false } = {}): string {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) {
    if (required) throw new ValidationError(`${key} is required`);
    return '';
  }
  if (v.length > 512) throw new ValidationError(`${key} is too long`);
  if (isTempRef(v, 'image') || isStoredImageRef(v) || /^\/images\/[\w.-]+$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === 'https:') return u.toString();
  } catch {
    /* fall through */
  }
  throw new ValidationError(`${key} must be an uploaded image or an https:// URL`);
}

/** Private PDF: a fresh upload ("temp/x.pdf") or an already stored "pdfs/x.pdf". */
function pdfRef(o: Obj, key: string): string | null {
  const v = str(o, key, { max: 255 });
  if (!v) return null;
  if (isTempRef(v, 'pdf') || isStoredPdfRef(v)) return v;
  throw new ValidationError(`${key} is not a valid uploaded PDF`);
}

function decimalInRange(o: Obj, key: string, min: number, max: number, fallback: number): string {
  const v = o[key];
  if (v === undefined || v === null || v === '') return fallback.toFixed(1);
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${key} must be between ${min} and ${max}`);
  return (Math.round(n * 10) / 10).toFixed(1);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export type MaterialInput = ReturnType<typeof parseMaterialInput>;

/**
 * Validates a full material payload. File fields may contain fresh "temp/..." refs;
 * they are moved into permanent storage by lib/server/materials.ts before saving.
 */
export function parseMaterialInput(body: Obj) {
  const title = localized(body, 'title', { required: true, max: 255 })!;
  const isFree = bool(body, 'isFree');
  const discountedPrice = isFree ? 0 : int(body, 'discountedPrice', { min: 0, max: 100000 });
  const originalPrice = isFree ? 0 : int(body, 'originalPrice', { min: 0, max: 100000, fallback: discountedPrice });
  if (originalPrice < discountedPrice) throw new ValidationError('MRP must be greater than or equal to the selling price');
  if (!isFree && discountedPrice === 0) throw new ValidationError('Paid materials need a price above ₹0 (or tick "Free download")');

  const coverImage = imageRef(body.coverImage, 'coverImage', { required: true });
  const rawSamples = Array.isArray(body.samplePages) ? body.samplePages : [];
  if (rawSamples.length > 10) throw new ValidationError('At most 10 sample pages are allowed');
  const samplePages = rawSamples.map((v, i) => imageRef(v, `samplePages[${i}]`)).filter(Boolean);

  const slug = str(body, 'slug', { max: 120 }).toLowerCase();
  if (slug && !SLUG_RE.test(slug)) throw new ValidationError('URL slug may contain only a-z, 0-9 and single hyphens');

  const tagsSource = typeof body.tags === 'string' ? { tags: body.tags.split(',') } : body;

  return {
    slug: slug || null, // null = auto-generate from the English title
    title,
    subtitle: localized(body, 'subtitle', { max: 255 }),
    description: localized(body, 'description', { required: true, max: 4000 })!,
    exam: oneOf(body, 'exam', EXAM_OPTIONS),
    subject: oneOf(body, 'subject', SUBJECT_OPTIONS),
    language: oneOf(body, 'language', MATERIAL_LANGUAGES, 'Marathi'),
    materialType: oneOf(body, 'materialType', MATERIAL_TYPES, 'PDF Notes'),
    coverImage,
    samplePages,
    pages: int(body, 'pages', { min: 1, max: 5000 }),
    originalPrice,
    discountedPrice,
    rating: decimalInRange(body, 'rating', 0, 5, 0),
    reviewsCount: int(body, 'reviewsCount', { min: 0, max: 10_000_000, fallback: 0 }),
    featured: bool(body, 'featured'),
    bestseller: bool(body, 'bestseller'),
    isFree,
    isPublished: body.isPublished === undefined ? true : bool(body, 'isPublished'),
    sortOrder: int(body, 'sortOrder', { min: -100000, max: 100000, fallback: 0 }),
    fileUrl: pdfRef(body, 'fileUrl'),
    fileName: str(body, 'fileName', { max: 255 }) || null,
    fileSize: str(body, 'fileSize', { max: 32 }) || null,
    tableOfContents: stringList(body, 'tableOfContents', { maxItems: 100 }),
    whatIsIncluded: stringList(body, 'whatIsIncluded', { maxItems: 30 }),
    tags: stringList(tagsSource, 'tags', { maxItems: 20, maxLen: 64 }),
    lastUpdatedLabel: todayLabel(),
  };
}

export function parseExamUpdateInput(body: Obj) {
  return {
    title: localized(body, 'title', { required: true, max: 500 })!,
    exam: str(body, 'exam', { required: true, max: 64 }),
    category: oneOf(body, 'category', UPDATE_CATEGORIES, 'Exam Notifications'),
    badge: oneOf(body, 'badge', UPDATE_BADGES, 'NEW'),
    publishedLabel: str(body, 'publishedLabel', { max: 64 }) || todayLabel(),
    lastDateLabel: str(body, 'lastDateLabel', { max: 64 }) || null,
    examDateLabel: str(body, 'examDateLabel', { max: 128 }) || null,
    shortSummary: localized(body, 'shortSummary', { required: true, max: 1000 })!,
    fullContent: localized(body, 'fullContent', { max: 10000 }) ?? localized(body, 'shortSummary', { max: 1000 })!,
    officialLink: safeUrl(body, 'officialLink', { required: true }),
    syllabusLink: safeUrl(body, 'syllabusLink') || null,
    isPublished: body.isPublished === undefined ? true : bool(body, 'isPublished'),
  };
}

/** Partial updates: validate the merged (existing + patch) object, so all rules still apply. */
export function mergeForPatch<T extends Obj>(existing: T, patch: Obj): Obj {
  return { ...existing, ...patch };
}

/** Shared input validators for other server modules (quizzes, etc.). */
export const validators = { str, int, bool, oneOf, localized, stringList, decimalInRange, imageRef, SLUG_RE };
