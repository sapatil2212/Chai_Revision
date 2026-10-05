import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db, schema } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight page-view beacon. No auth required — every visitor fires this.
 * Privacy-first: we hash IP + User-Agent so no PII is stored.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path.slice(0, 512) : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : null;

    // Build a privacy-safe visitor fingerprint
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const ua = req.headers.get('user-agent') || '';
    const visitorHash = createHash('sha256').update(`${ip}|${ua}`).digest('hex');

    // Parse device/browser from UA
    const deviceType = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
    const browser = parseBrowser(ua);
    const os = parseOS(ua);

    // Country from Cloudflare / Vercel headers (null if not behind a proxy)
    const country =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      null;

    await db.insert(schema.pageViews).values({
      visitorHash,
      path,
      referrer,
      deviceType,
      browser,
      os,
      country,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Never let tracking errors break the site
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/msie|trident/i.test(ua)) return 'IE';
  return 'Other';
}

function parseOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}
