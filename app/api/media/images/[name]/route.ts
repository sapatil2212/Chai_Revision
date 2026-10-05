import { NextResponse } from 'next/server';
import { readPublicImage } from '@/lib/server/storage';

export const runtime = 'nodejs';

/** Public: serves admin-uploaded cover images. PDFs are intentionally not reachable here. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = await readPublicImage(name);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'public, max-age=31536000, immutable', // file names are unique per upload
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
