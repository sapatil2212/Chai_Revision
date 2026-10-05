import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db, schema } from '@/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { CACHE_TAGS, parseExamUpdateInput, toAdminUpdate } from '@/lib/server/content';
import { apiError, readJson } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function findUpdate(id: string) {
  const [row] = await db.select().from(schema.examUpdates).where(eq(schema.examUpdates.id, id));
  return row;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await findUpdate(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const current = toAdminUpdate(existing);
    const input = parseExamUpdateInput({
      ...current,
      publishedLabel: current.publishedDate,
      lastDateLabel: current.lastDate,
      examDateLabel: current.examDate,
      ...(await readJson(req)),
    });
    await db.update(schema.examUpdates).set(input).where(eq(schema.examUpdates.id, id));
    revalidateTag(CACHE_TAGS.examUpdates);
    return NextResponse.json({ item: toAdminUpdate(await findUpdate(id)) });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const result = await db.delete(schema.examUpdates).where(eq(schema.examUpdates.id, id));
    const affected = (result as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
    if (!affected) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidateTag(CACHE_TAGS.examUpdates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
