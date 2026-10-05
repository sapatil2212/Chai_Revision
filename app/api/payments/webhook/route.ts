import { NextResponse, type NextRequest } from 'next/server';
import { failOrder, markOrderPaid } from '@/lib/server/payments/orders';
import { toPaise, verifyWebhookSignature, webhookConfigured } from '@/lib/server/payments/razorpay';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const O = schema.orders;

/**
 * Razorpay webhook. Add this URL in Dashboard → Settings → Webhooks with the same
 * secret as RAZORPAY_WEBHOOK_SECRET, subscribed to:
 *   payment.captured, payment.failed, order.paid
 *
 * This is the authoritative path: if the buyer closes the tab before the browser can
 * confirm, the webhook still grants access. It is deliberately NOT same-origin
 * checked (Razorpay is a third party) — the HMAC over the raw body is what
 * authenticates it, so the body must be read unparsed.
 */
export async function POST(req: NextRequest) {
  if (!webhookConfigured()) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not set; rejecting');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  if (!verifyWebhookSignature(raw, signature)) {
    // Never reveal why; a forged call learns nothing
    console.warn('[webhook] rejected a request with an invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string; error_description?: string } };
      order?: { entity?: { id?: string; amount?: number } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  const name = event.event || '';
  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;

  try {
    if (!rzpOrderId) {
      // Nothing we can map to an order; acknowledge so Razorpay stops retrying
      return NextResponse.json({ ok: true, ignored: name || 'unknown' });
    }

    const [order] = await db.select().from(O).where(eq(O.paymentOrderId, rzpOrderId));
    if (!order) {
      console.warn(`[webhook] ${name}: no local order for gateway order ${rzpOrderId}`);
      return NextResponse.json({ ok: true, ignored: 'unknown order' });
    }

    if (name === 'payment.captured' || name === 'order.paid') {
      const paidPaise = payment?.amount ?? event.payload?.order?.entity?.amount;
      // Guard against an event that does not match what we expect to be paid
      if (paidPaise !== undefined && paidPaise !== toPaise(order.totalAmount)) {
        console.error(`[webhook] ${name}: amount mismatch for ${order.id} (got ${paidPaise})`);
        return NextResponse.json({ ok: true, ignored: 'amount mismatch' });
      }
      const { alreadyPaid } = await markOrderPaid(order.id, {
        paymentId: payment?.id || order.paymentId || rzpOrderId,
        method: payment?.method ?? null,
      });
      return NextResponse.json({ ok: true, orderId: order.id, alreadyPaid });
    }

    if (name === 'payment.failed') {
      await failOrder(order.id, payment?.error_description || 'payment.failed');
      return NextResponse.json({ ok: true, orderId: order.id, status: 'Failed' });
    }

    return NextResponse.json({ ok: true, ignored: name });
  } catch (err) {
    // 500 makes Razorpay retry, which is what we want for a transient DB error
    console.error('[webhook] handler failed:', (err as Error).message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
