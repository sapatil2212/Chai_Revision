// Razorpay REST client + signature verification.
//
// We talk to the REST API with fetch and verify signatures with node crypto rather
// than pulling in the SDK: fewer dependencies for two endpoints and two HMACs.
//
// Secrets are read from the environment and never logged or returned to the browser.
// Only the public key id is ever sent to the client.
import { createHmac, timingSafeEqual } from 'crypto';
import { HttpError } from '../content';

const API = 'https://api.razorpay.com/v1';

/** Razorpay deals in paise; our catalogue stores whole rupees. */
export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => Math.round(paise) / 100;

const env = (key: string) => process.env[key]?.trim() || '';

export const razorpayKeyId = () => env('RAZORPAY_KEY_ID');
const razorpayKeySecret = () => env('RAZORPAY_KEY_SECRET');
const webhookSecret = () => env('RAZORPAY_WEBHOOK_SECRET');

/** True once the key pair is present, so the UI can hide checkout when it is not. */
export const paymentsConfigured = () => !!razorpayKeyId() && !!razorpayKeySecret();

/** 'live' | 'test' | null — drives the warning banner and guards destructive tests. */
export function razorpayMode(): 'live' | 'test' | null {
  const id = razorpayKeyId();
  if (id.startsWith('rzp_live_')) return 'live';
  if (id.startsWith('rzp_test_')) return 'test';
  return null;
}

export const webhookConfigured = () => !!webhookSecret();

function requireKeys() {
  const id = razorpayKeyId();
  const secret = razorpayKeySecret();
  if (!id || !secret) {
    throw new HttpError(503, 'Online payment is not configured yet. Please try again later.');
  }
  return { id, secret };
}

const authHeader = () => {
  const { id, secret } = requireKeys();
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
};

/** Constant-time compare of two hex digests. */
function sameDigest(expected: string, given: string) {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(given || '', 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

// -------------------------------------------------------------------------
// API calls
// -------------------------------------------------------------------------

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  status: string;
  receipt?: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[razorpay] network error:', (err as Error).message);
    throw new HttpError(502, 'Could not reach the payment gateway. Please try again.');
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error page */
  }

  if (!res.ok) {
    const description = (body as { error?: { description?: string } })?.error?.description;
    // Log the gateway's reason for us, show the customer something safe
    console.error(`[razorpay] ${path} failed (${res.status}): ${description || text.slice(0, 200)}`);
    if (res.status === 401) throw new HttpError(503, 'Payment gateway credentials were rejected. Please contact support.');
    throw new HttpError(502, description || 'The payment gateway rejected this request.');
  }
  return body as T;
}

/**
 * Creates a Razorpay order. This reserves nothing and charges nothing — money only
 * moves when the customer completes checkout against this order id.
 */
export function createRazorpayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!Number.isInteger(opts.amountPaise) || opts.amountPaise < 100) {
    // Razorpay's floor is ₹1
    throw new HttpError(400, 'Order amount must be at least ₹1.');
  }
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: 'INR',
      receipt: opts.receipt.slice(0, 40),
      notes: opts.notes || {},
      payment_capture: 1,
    }),
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number; // paise
  method?: string;
  email?: string;
  contact?: string;
  error_description?: string;
}

/** Source of truth for a payment's real state. Used before granting access. */
export const fetchRazorpayPayment = (paymentId: string) =>
  call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);

// -------------------------------------------------------------------------
// Signatures
// -------------------------------------------------------------------------

/**
 * Checkout handback signature: HMAC-SHA256 of "<order_id>|<payment_id>" with the key secret.
 * Proves the browser's success callback really came from Razorpay.
 */
export function verifyCheckoutSignature(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const { secret } = requireKeys();
  const expected = createHmac('sha256', secret)
    .update(`${opts.razorpayOrderId}|${opts.razorpayPaymentId}`)
    .digest('hex');
  return sameDigest(expected, opts.signature);
}

/**
 * Webhook signature: HMAC-SHA256 of the **raw** request body with the webhook secret.
 * The body must not be re-serialised before this check or the digest will not match.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = webhookSecret();
  if (!secret) throw new HttpError(503, 'Webhook secret is not configured.');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return sameDigest(expected, signature);
}
