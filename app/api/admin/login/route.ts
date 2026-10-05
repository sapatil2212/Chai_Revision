import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  clearLoginFailures,
  clientIp,
  createSessionToken,
  isSameOrigin,
  loginRetryAfter,
  recordLoginFailure,
  sessionCookieOptions,
  verifyCredentials,
} from '@/lib/server/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
  }

  const ip = clientIp(req);
  const retryAfter = loginRetryAfter(ip);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.slice(0, 254) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (!verifyCredentials(email, password)) {
    recordLoginFailure(ip);
    return NextResponse.json({ error: 'Invalid superadmin credentials.' }, { status: 401 });
  }

  clearLoginFailures(ip);
  const adminEmail = process.env.ADMIN_USER as string;
  const { token, maxAge } = createSessionToken(adminEmail, body.remember === true);
  const res = NextResponse.json({ ok: true, email: adminEmail });
  res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions(maxAge));
  return res;
}
