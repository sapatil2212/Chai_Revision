import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { getMaterial } from '@/lib/server/materials';
import { openPdf, pdfResponse } from '@/lib/server/storage';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin-only: view/download the private PDF attached to a material (any price, any publish state). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const row = await getMaterial(id);
    if (!row.fileUrl) return NextResponse.json({ error: 'No PDF uploaded for this material' }, { status: 404 });
    const file = await openPdf(row.fileUrl);
    if (!file) return NextResponse.json({ error: 'PDF file is missing from storage' }, { status: 404 });
    return pdfResponse(file, row.fileName || `${row.slug}.pdf`, req.nextUrl.searchParams.get('inline') === '1');
  } catch (err) {
    return apiError(err);
  }
}
