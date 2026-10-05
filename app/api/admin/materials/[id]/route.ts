import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { deleteMaterial, getMaterial, updateMaterial } from '@/lib/server/materials';
import { toAdminMaterial } from '@/lib/server/content';
import { apiError, readJson } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ item: toAdminMaterial(await getMaterial(id)) });
  } catch (err) {
    return apiError(err);
  }
}

/** Partial update: merges the patch over the current record, then validates the whole thing. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ item: await updateMaterial(id, await readJson(req)) });
  } catch (err) {
    return apiError(err);
  }
}

/** Deletes the material and its files. If it was already purchased, it's unpublished instead. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, ...(await deleteMaterial(id)) });
  } catch (err) {
    return apiError(err);
  }
}
