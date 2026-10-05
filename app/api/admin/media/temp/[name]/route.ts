import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { readTempFile } from '@/lib/server/storage';

export const runtime = 'nodejs';

/** Admin-only preview of a file that was uploaded but not yet saved to a material. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { name } = await params;
  const file = await readTempFile(name);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
