import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { leaderboard } from '@/lib/server/quiz/attempts';
import { existingParticipant } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Top scorers (best on-time attempt per participant). ?limit=10 (max 50). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const limit = Number(req.nextUrl.searchParams.get('limit')) || 10;
    return NextResponse.json(await leaderboard(slug, existingParticipant(req), limit), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return apiError(err);
  }
}
