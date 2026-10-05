import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { submitAttempt } from '@/lib/server/quiz/attempts';
import { assertSameOrigin } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';

/** Body: { token, answers }. Scores on the server and returns the result (idempotent). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { token?: unknown; answers?: unknown };
    return NextResponse.json(await submitAttempt(Number(id), body.token, body.answers), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return apiError(err);
  }
}
