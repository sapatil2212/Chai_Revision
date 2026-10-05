import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { duplicateMaterial } from '@/lib/server/materials';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ item: await duplicateMaterial(id) }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
