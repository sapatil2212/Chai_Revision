import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db, schema } from '@/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { CACHE_TAGS, parseExamUpdateInput, slugify, toAdminUpdate } from '@/lib/server/content';
import { apiError, readJson } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const rows = await db.select().from(schema.examUpdates).orderBy(desc(schema.examUpdates.createdAt));
    return NextResponse.json({ items: rows.map(toAdminUpdate) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const input = parseExamUpdateInput(await readJson(req));
    const id = `upd-${randomUUID().slice(0, 8)}`;
    const base = slugify(input.title.en) || id;
    const taken = await db.select({ id: schema.examUpdates.id }).from(schema.examUpdates).where(eq(schema.examUpdates.slug, base));
    const slug = taken.length ? `${base}-${id.slice(4)}` : base;

    await db.insert(schema.examUpdates).values({ id, slug, ...input });
    const [row] = await db.select().from(schema.examUpdates).where(eq(schema.examUpdates.id, id));
    revalidateTag(CACHE_TAGS.examUpdates);
    return NextResponse.json({ item: toAdminUpdate(row) }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
