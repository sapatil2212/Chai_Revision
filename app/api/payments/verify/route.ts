import { NextResponse, type NextRequest } from 'next/server';
import { apiError, readJson } from '@/lib/server/apiErrors';
import { confirmCheckout } from '@/lib/server/payments/orders';
import { assertSameOrigin, rateLimit } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { orderId, razorpayPaymentId, razorpaySignature }
 * Called by the browser right after Razorpay Checkout succeeds. The signature and a
 * server-side payment lookup must both pass before download tokens are issued.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(req, 'payment-verify', 40, 10 * 60 * 1000);
    const receipt = await confirmCheckout(await readJson(req));
    return NextResponse.json(receipt, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
