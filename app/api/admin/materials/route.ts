import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { createMaterial, listMaterials } from '@/lib/server/materials';
import { apiError, readJson } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return NextResponse.json({ items: await listMaterials() });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const item = await createMaterial(await readJson(req));
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
