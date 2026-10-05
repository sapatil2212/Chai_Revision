import { NextResponse, type NextRequest } from 'next/server';
import { apiError, readJson } from '@/lib/server/apiErrors';
import { quoteCart } from '@/lib/server/payments/orders';
import { paymentsConfigured } from '@/lib/server/payments/razorpay';
import { assertSameOrigin } from '@/lib/server/quiz/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { materialIds: string[], couponCode?: string }
 * Returns the authoritative price for a cart. The browser displays this; it never
 * computes totals itself.
 */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = await readJson(req);
    const quote = await quoteCart(body.materialIds, body.couponCode);
    return NextResponse.json(
      { ...quote, paymentsEnabled: paymentsConfigured() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return apiError(err);
  }
}
