import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getPreviewPdf } from '@/lib/server/storage';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public sample preview: a PDF with only the first few pages of a published material.
 * Generated automatically from the uploaded PDF — the full document is never sent.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [row] = await db
      .select({ fileUrl: schema.materials.fileUrl })
      .from(schema.materials)
      .where(and(eq(schema.materials.slug, slug), eq(schema.materials.isPublished, true)));
    if (!row?.fileUrl) return NextResponse.json({ error: 'Preview not available' }, { status: 404 });

    const preview = await getPreviewPdf(row.fileUrl);
    if (!preview) return NextResponse.json({ error: 'Preview not available' }, { status: 404 });

    return new NextResponse(new Uint8Array(preview.data), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'Content-Length': String(preview.data.length),
        'X-Preview-Pages': String(preview.previewPages),
        'X-Total-Pages': String(preview.totalPages),
        'Access-Control-Expose-Headers': 'X-Preview-Pages, X-Total-Pages',
        // Short cache: a replaced PDF gets a new file name, so stale previews expire quickly
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
