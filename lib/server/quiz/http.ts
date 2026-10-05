// HTTP helpers for public quiz routes: participant cookie, same-origin + simple rate limiting.
import { NextResponse, type NextRequest } from 'next/server';
import { isSameOrigin, clientIp } from '../adminAuth';
import { HttpError } from '../content';
import { PARTICIPANT_COOKIE, isValidParticipantId, newParticipantId } from './attempts';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Returns the browser's participant id, creating one if needed (`isNew` → set the cookie on the response). */
export function participantFrom(req: NextRequest): { id: string; isNew: boolean } {
  const existing = req.cookies.get(PARTICIPANT_COOKIE)?.value;
  return isValidParticipantId(existing) ? { id: existing, isNew: false } : { id: newParticipantId(), isNew: true };
}

export function existingParticipant(req: NextRequest): string | undefined {
  const v = req.cookies.get(PARTICIPANT_COOKIE)?.value;
  return isValidParticipantId(v) ? v : undefined;
}

export function withParticipantCookie(res: NextResponse, participant: { id: string; isNew: boolean }) {
  if (participant.isNew) {
    res.cookies.set(PARTICIPANT_COOKIE, participant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR,
    });
  }
  return res;
}

/** Mutating public requests must come from our own pages. */
export function assertSameOrigin(req: NextRequest) {
  if (!isSameOrigin(req)) throw new HttpError(403, 'Cross-origin request blocked');
}

// In-memory sliding window per IP + action (resets on restart; good enough for a single VPS process)
const hits = new Map<string, number[]>();
export function rateLimit(req: NextRequest, action: string, max: number, windowMs: number) {
  // Allow automated tests (never production) to bypass the limiter
  if (process.env.NODE_ENV !== 'production' && req.headers.get('x-e2e-bypass') === process.env.ADMIN_SESSION_SECRET) return;
  const key = `${action}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new HttpError(429, 'Too many requests. Please wait a moment and try again.');
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear(); // bound memory
}
