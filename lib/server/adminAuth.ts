// Server-only helpers for superadmin authentication.
// Session = HMAC-SHA256 signed token in an HttpOnly cookie. No secrets reach the client.
import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'cr_admin_session';
const SESSION_TTL_SHORT = 60 * 60 * 8; // 8 hours (no "remember me")
const SESSION_TTL_LONG = 60 * 60 * 24 * 7; // 7 days ("remember me")

interface SessionPayload {
  sub: string; // admin email
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short (min 32 chars).');
  }
  return secret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

/** Constant-time string compare (hash first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyCredentials(email: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  if (!expectedUser || !expectedPass) {
    throw new Error('ADMIN_USER / ADMIN_PASS are not configured in .env');
  }
  // Evaluate both comparisons to avoid leaking which one failed via timing
  const userOk = safeEqual(email.trim().toLowerCase(), expectedUser.trim().toLowerCase());
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

export function createSessionToken(email: string, remember: boolean): { token: string; maxAge: number } {
  const maxAge = remember ? SESSION_TTL_LONG : SESSION_TTL_SHORT;
  const payload: SessionPayload = { sub: email, exp: Math.floor(Date.now() / 1000) + maxAge };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign(body)}`, maxAge };
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (!safeEqual(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    // Invalidate sessions if the configured admin account changes
    if (payload.sub.toLowerCase() !== (process.env.ADMIN_USER || '').toLowerCase()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

/**
 * Guard for admin API routes. Returns a 401/403 response to send back, or null if allowed.
 * Mutating requests must also come from the same origin (CSRF defence on top of SameSite=strict).
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD' && !isSameOrigin(req)) {
    return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
  }
  return null;
}

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------------------
// Basic in-memory login throttling (per IP). Resets on server restart.
// -------------------------------------------------------------------------
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; firstAt: number }>();

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

/** Returns seconds until the IP may retry, or 0 if allowed. */
export function loginRetryAfter(ip: string): number {
  const entry = attempts.get(ip);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.firstAt;
  if (elapsed > WINDOW_MS) {
    attempts.delete(ip);
    return 0;
  }
  return entry.count >= MAX_ATTEMPTS ? Math.ceil((WINDOW_MS - elapsed) / 1000) : 0;
}

export function recordLoginFailure(ip: string) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearLoginFailures(ip: string) {
  attempts.delete(ip);
}
