import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { saveAnswers } from '@/lib/server/quiz/attempts';
import { assertSameOrigin, rateLimit } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';

/** Autosave. Body: { token, answers: { [questionId]: 'A'|'B'|'C'|'D'|null } } */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    rateLimit(req, 'quiz-autosave', 240, 10 * 60 * 1000);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { token?: unknown; answers?: unknown };
    return NextResponse.json(await saveAnswers(Number(id), body.token, body.answers));
  } catch (err) {
    return apiError(err);
  }
}
