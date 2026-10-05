import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { myAttempts } from '@/lib/server/quiz/attempts';
import { existingParticipant } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** This browser's submitted attempts (identified by the HttpOnly participant cookie). */
export async function GET(req: NextRequest) {
  try {
    const pid = existingParticipant(req);
    return NextResponse.json({ items: pid ? await myAttempts(pid) : [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
