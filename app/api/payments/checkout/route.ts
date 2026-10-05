import { NextResponse, type NextRequest } from 'next/server';
import { apiError, readJson } from '@/lib/server/apiErrors';
import { createCheckout } from '@/lib/server/payments/orders';
import { assertSameOrigin, rateLimit } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { materialIds: string[], couponCode?: string, buyer: { name, email, mobile } }
 * Creates our order plus a Razorpay order and returns what Razorpay Checkout needs.
 * Nothing is charged here — the customer still has to complete the payment.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    // Creating orders hits a third-party API, so cap how fast one IP can do it
    rateLimit(req, 'payment-checkout', 20, 10 * 60 * 1000);
    const session = await createCheckout(await readJson(req));
    return NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
