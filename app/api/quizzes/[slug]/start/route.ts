import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { startAttempt } from '@/lib/server/quiz/attempts';
import { assertSameOrigin, participantFrom, rateLimit, withParticipantCookie } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { name, mobile, address, email? } — collected from the student before the test.
 * Starts (or resumes) a timed attempt. Questions are returned without answers.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(req);
    rateLimit(req, 'quiz-start', 60, 10 * 60 * 1000);
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const participant = participantFrom(req);
    const session = await startAttempt(slug, participant.id, body);
    return withParticipantCookie(NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } }), participant);
  } catch (err) {
    return apiError(err);
  }
}
