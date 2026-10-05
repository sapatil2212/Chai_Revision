import { NextResponse, type NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { incrementDownloads } from '@/lib/server/materials';
import { entitlementForToken } from '@/lib/server/payments/orders';
import { openPdf, pdfResponse } from '@/lib/server/storage';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Download a material's PDF. Published materials only.
 *  - free materials: open to anyone
 *  - paid materials: require ?token=<downloadToken> from a completed order
 * ?inline=1 opens the PDF in the browser instead of downloading.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [row] = await db
      .select()
      .from(schema.materials)
      .where(and(eq(schema.materials.slug, slug), eq(schema.materials.isPublished, true)));

    if (!row) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

    if (!row.isFree) {
      // Paid material: the only key is a download token issued by a completed order
      const token = req.nextUrl.searchParams.get('token') || '';
      const entitlement = token ? await entitlementForToken(token) : null;
      if (!entitlement || entitlement.materialId !== row.id) {
        return NextResponse.json(
          { error: 'This material must be purchased before downloading.' },
          { status: 403 }
        );
      }
    }

    if (!row.fileUrl) return NextResponse.json({ error: 'The PDF for this material is not available yet.' }, { status: 404 });

    const file = await openPdf(row.fileUrl);
    if (!file) return NextResponse.json({ error: 'The PDF for this material is not available yet.' }, { status: 404 });

    // Count downloads, but never block the file on a stats write
    void incrementDownloads(row.id).catch((err) => console.error('[download] count failed', err));
    return pdfResponse(file, row.fileName || `${row.slug}.pdf`, req.nextUrl.searchParams.get('inline') === '1');
  } catch (err) {
    return apiError(err);
  }
}
