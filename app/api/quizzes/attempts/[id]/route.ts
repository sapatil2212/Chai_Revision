import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { getAttempt } from '@/lib/server/quiz/attempts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** ?token=… → { session } while in progress, or { result } once submitted / timed out. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getAttempt(Number(id), req.nextUrl.searchParams.get('token'));
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
