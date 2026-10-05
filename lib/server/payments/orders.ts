// Order lifecycle for study-material purchases.
//
// Security rules this module enforces:
//  1. Prices NEVER come from the browser. Every amount is recomputed from the
//     materials table, so a tampered cart cannot change what is charged.
//  2. Coupons are validated against the coupons table (active, unexpired, under
//     its usage cap). The old client-side "CHAI10 = 10% off" is gone.
//  3. Access is granted only after a payment is verified with Razorpay — either by
//     the checkout signature plus a payment fetch, or by a signed webhook.
//  4. markOrderPaid() is idempotent, because the webhook and the browser callback
//     both race to confirm the same order.
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { HttpError, NotFoundError, ValidationError } from '../content';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  paymentsConfigured,
  razorpayKeyId,
  toPaise,
  verifyCheckoutSignature,
} from './razorpay';

const M = schema.materials;
const O = schema.orders;
const OI = schema.orderItems;
const U = schema.users;
const C = schema.coupons;

const MAX_CART_ITEMS = 20;

// -------------------------------------------------------------------------
// Receipt access tokens (so one buyer cannot read another's order)
// -------------------------------------------------------------------------

function secret() {
  const s = process.env.QUIZ_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('QUIZ_TOKEN_SECRET is missing or too short (min 32 chars).');
  return s;
}

export const orderToken = (orderId: string) =>
  createHmac('sha256', secret()).update(`order:${orderId}`).digest('base64url');

function assertOrderToken(orderId: string, token: unknown) {
  if (typeof token !== 'string' || !token) throw new HttpError(401, 'Invalid order token');
  const expected = Buffer.from(orderToken(orderId));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new HttpError(401, 'Invalid order token');
  }
}

// -------------------------------------------------------------------------
// Buyer details
// -------------------------------------------------------------------------

const strip = (v: unknown, max: number) =>
  (typeof v === 'string' ? v : '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export interface Buyer {
  name: string;
  email: string;
  mobile: string;
}

/** Email is required for a purchase: it is where the receipt and download link go. */
export function parseBuyer(raw: unknown): Buyer {
  const o = (raw ?? {}) as Record<string, unknown>;

  const name = strip(o.name, 80);
  if (name.length < 2) throw new ValidationError('Please enter your full name.');

  const email = strip(o.email, 191).toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) {
    throw new ValidationError('Please enter a valid email address — your download link is sent there.');
  }

  const digits = (typeof o.mobile === 'string' ? o.mobile : '').replace(/\D/g, '');
  const mobile = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new ValidationError('Please enter a valid 10-digit mobile number.');

  return { name, email, mobile };
}

/**
 * Purchases do not require an account yet, so a lightweight buyer record is created
 * (or reused) from the email address. It has no password and cannot sign in.
 */
async function guestUserId(buyer: Buyer): Promise<string> {
  const [existing] = await db.select({ id: U.id }).from(U).where(eq(U.email, buyer.email));
  if (existing) {
    await db.update(U).set({ name: buyer.name, mobile: buyer.mobile }).where(eq(U.id, existing.id));
    return existing.id;
  }
  const id = randomUUID();
  await db.insert(U).values({
    id,
    name: buyer.name,
    email: buyer.email,
    mobile: buyer.mobile,
    passwordHash: null,
    role: 'student',
    preferredLanguage: 'mr',
    targetExams: [],
  });
  return id;
}

// -------------------------------------------------------------------------
// Authoritative quote
// -------------------------------------------------------------------------

export interface QuoteItem {
  id: string;
  slug: string;
  title: string;
  exam: string;
  pages: number;
  price: number;
}

export interface Quote {
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: { code: string; discountPercent: number } | null;
  /** Reason the submitted coupon was not applied, for the UI to show. */
  couponError: string | null;
}

function parseIds(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const ids = [...new Set(list.filter((x): x is string => typeof x === 'string' && !!x && x.length <= 64))];
  if (!ids.length) throw new ValidationError('Your cart is empty.');
  if (ids.length > MAX_CART_ITEMS) throw new ValidationError(`At most ${MAX_CART_ITEMS} items can be bought at once.`);
  return ids;
}

/** Looks up a coupon and says why it cannot be used, rather than silently ignoring it. */
async function resolveCoupon(code: string) {
  const [row] = await db.select().from(C).where(eq(C.code, code));
  if (!row) return { coupon: null, error: 'That coupon code is not valid.' };
  if (!row.isActive) return { coupon: null, error: 'That coupon is no longer active.' };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return { coupon: null, error: 'That coupon has expired.' };
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    return { coupon: null, error: 'That coupon has reached its usage limit.' };
  }
  if (row.discountPercent <= 0 || row.discountPercent > 100) {
    return { coupon: null, error: 'That coupon is misconfigured.' };
  }
  return { coupon: { code: row.code, discountPercent: row.discountPercent }, error: null };
}

/**
 * The only place a payable amount is calculated. Both checkout and the UI use it,
 * so what the customer sees and what Razorpay is told always agree.
 */
export async function quoteCart(rawIds: unknown, rawCoupon?: unknown): Promise<Quote> {
  const ids = parseIds(rawIds);

  const rows = await db
    .select({
      id: M.id,
      slug: M.slug,
      title: M.title,
      exam: M.exam,
      pages: M.pages,
      price: M.discountedPrice,
      isFree: M.isFree,
      isPublished: M.isPublished,
    })
    .from(M)
    .where(and(inArray(M.id, ids), eq(M.isPublished, true)));

  const missing = ids.filter((id) => !rows.some((r) => r.id === id));
  if (missing.length) {
    throw new ValidationError('Some items in your cart are no longer available. Please refresh and try again.');
  }
  const free = rows.filter((r) => r.isFree);
  if (free.length) {
    throw new ValidationError('Free materials do not need to be purchased — download them from Free Resources.');
  }

  const items: QuoteItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title.en || r.title.mr,
    exam: r.exam,
    pages: r.pages,
    price: r.price,
  }));

  const subtotal = items.reduce((n, i) => n + i.price, 0);

  const code = strip(rawCoupon, 32).toUpperCase();
  let coupon: Quote['coupon'] = null;
  let couponError: string | null = null;
  if (code) {
    const resolved = await resolveCoupon(code);
    coupon = resolved.coupon;
    couponError = resolved.error;
  }

  const discount = coupon ? Math.round((subtotal * coupon.discountPercent) / 100) : 0;
  return { items, subtotal, discount, total: Math.max(0, subtotal - discount), coupon, couponError };
}

// -------------------------------------------------------------------------
// Checkout
// -------------------------------------------------------------------------

const newOrderId = () => `CR-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

export interface CheckoutSession {
  orderId: string;
  orderToken: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  buyer: Buyer;
  quote: Quote;
}

export async function createCheckout(body: Record<string, unknown>): Promise<CheckoutSession> {
  if (!paymentsConfigured()) {
    throw new HttpError(503, 'Online payment is not available right now. Please try again later.');
  }

  const buyer = parseBuyer(body.buyer);
  const quote = await quoteCart(body.materialIds, body.couponCode);
  if (quote.total < 1) throw new ValidationError('The payable amount must be at least ₹1.');

  const userId = await guestUserId(buyer);
  const orderId = newOrderId();

  // Our order first, so a gateway order can never exist without a local record
  await db.transaction(async (tx) => {
    await tx.insert(O).values({
      id: orderId,
      userId,
      subtotal: quote.subtotal,
      discount: quote.discount,
      totalAmount: quote.total,
      couponCode: quote.coupon?.code ?? null,
      status: 'Pending',
      paymentProvider: 'razorpay',
    });
    await tx.insert(OI).values(
      quote.items.map((i) => ({ orderId, materialId: i.id, priceAtPurchase: i.price }))
    );
  });

  let rzp;
  try {
    rzp = await createRazorpayOrder({
      amountPaise: toPaise(quote.total),
      receipt: orderId,
      notes: { orderId, email: buyer.email, mobile: buyer.mobile },
    });
  } catch (err) {
    // Do not leave a Pending order behind if the gateway refused
    await db.update(O).set({ status: 'Failed' }).where(eq(O.id, orderId));
    throw err;
  }

  await db.update(O).set({ paymentOrderId: rzp.id }).where(eq(O.id, orderId));

  return {
    orderId,
    orderToken: orderToken(orderId),
    razorpayOrderId: rzp.id,
    amountPaise: rzp.amount,
    currency: 'INR',
    keyId: razorpayKeyId(), // public key id; the secret never leaves the server
    buyer,
    quote,
  };
}

// -------------------------------------------------------------------------
// Granting access
// -------------------------------------------------------------------------

const newDownloadToken = () => randomBytes(24).toString('hex');

/**
 * Marks an order paid and issues lifetime download tokens. Safe to call repeatedly:
 * the browser callback and the webhook both confirm the same payment.
 */
export async function markOrderPaid(
  orderId: string,
  payment: { paymentId: string; method?: string | null }
): Promise<{ alreadyPaid: boolean }> {
  const [order] = await db.select().from(O).where(eq(O.id, orderId));
  if (!order) throw new NotFoundError('Order not found');
  if (order.status === 'Completed') return { alreadyPaid: true };

  await db.transaction(async (tx) => {
    // Only the first writer transitions the order, so tokens are never reissued
    const res = await tx
      .update(O)
      .set({
        status: 'Completed',
        paymentId: payment.paymentId,
        paymentMethod: payment.method || null,
        paidAt: new Date(),
      })
      .where(and(eq(O.id, orderId), sql`${O.status} <> 'Completed'`));
    const changed = (res as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
    if (!changed) return;

    const items = await tx.select({ id: OI.id, token: OI.downloadToken }).from(OI).where(eq(OI.orderId, orderId));
    for (const item of items) {
      if (item.token) continue; // tokenExpiresAt null = lifetime access
      await tx.update(OI).set({ downloadToken: newDownloadToken() }).where(eq(OI.id, item.id));
    }
    if (order.couponCode) {
      await tx.update(C).set({ usedCount: sql`${C.usedCount} + 1` }).where(eq(C.code, order.couponCode));
    }
  });

  return { alreadyPaid: false };
}

export async function failOrder(orderId: string, reason?: string) {
  const [order] = await db.select({ status: O.status }).from(O).where(eq(O.id, orderId));
  if (!order || order.status === 'Completed') return; // never undo a paid order
  await db.update(O).set({ status: 'Failed' }).where(eq(O.id, orderId));
  if (reason) console.warn(`[payments] order ${orderId} failed: ${reason}`);
}

/**
 * Confirms the browser's success callback. The signature proves the message came from
 * Razorpay; the payment fetch proves the money was actually captured for this order
 * and this amount. Both must hold before access is granted.
 */
export async function confirmCheckout(body: Record<string, unknown>) {
  const orderId = strip(body.orderId, 32);
  const paymentId = strip(body.razorpayPaymentId, 64);
  const signature = strip(body.razorpaySignature, 256);
  if (!orderId || !paymentId || !signature) throw new ValidationError('Missing payment confirmation details.');

  const [order] = await db.select().from(O).where(eq(O.id, orderId));
  if (!order) throw new NotFoundError('Order not found');
  if (!order.paymentOrderId) throw new HttpError(409, 'This order was never sent to the payment gateway.');

  if (order.status === 'Completed') return orderReceipt(orderId, orderToken(orderId));

  if (!verifyCheckoutSignature({ razorpayOrderId: order.paymentOrderId, razorpayPaymentId: paymentId, signature })) {
    await failOrder(orderId, 'checkout signature mismatch');
    throw new HttpError(400, 'Payment could not be verified. You have not been charged twice — contact support if money was debited.');
  }

  const payment = await fetchRazorpayPayment(paymentId);
  if (payment.order_id !== order.paymentOrderId) {
    throw new HttpError(400, 'This payment belongs to a different order.');
  }
  if (payment.amount !== toPaise(order.totalAmount)) {
    throw new HttpError(400, 'The paid amount does not match this order.');
  }
  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    await failOrder(orderId, `payment status ${payment.status}`);
    throw new HttpError(402, `Payment was not successful (${payment.status}).`);
  }

  await markOrderPaid(orderId, { paymentId, method: payment.method });
  return orderReceipt(orderId, orderToken(orderId));
}

// -------------------------------------------------------------------------
// Receipt
// -------------------------------------------------------------------------

export interface ReceiptItem {
  materialId: string;
  slug: string;
  title: string;
  exam: string;
  price: number;
  /** Present only once the order is paid. */
  downloadToken: string | null;
  hasFile: boolean;
}

export async function orderReceipt(orderId: string, token: unknown) {
  assertOrderToken(orderId, token);

  const [order] = await db.select().from(O).where(eq(O.id, orderId));
  if (!order) throw new NotFoundError('Order not found');

  const [buyer] = await db.select({ name: U.name, email: U.email, mobile: U.mobile }).from(U).where(eq(U.id, order.userId));

  const rows = await db
    .select({
      materialId: OI.materialId,
      price: OI.priceAtPurchase,
      downloadToken: OI.downloadToken,
      slug: M.slug,
      title: M.title,
      exam: M.exam,
      fileUrl: M.fileUrl,
    })
    .from(OI)
    .innerJoin(M, eq(M.id, OI.materialId))
    .where(eq(OI.orderId, orderId));

  const paid = order.status === 'Completed';
  const items: ReceiptItem[] = rows.map((r) => ({
    materialId: r.materialId,
    slug: r.slug,
    title: r.title.mr || r.title.en,
    exam: r.exam,
    price: r.price,
    downloadToken: paid ? r.downloadToken : null,
    hasFile: !!r.fileUrl,
  }));

  return {
    orderId: order.id,
    status: order.status,
    paid,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.totalAmount,
    couponCode: order.couponCode,
    paymentId: order.paymentId,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    buyer: buyer ? { name: buyer.name, email: buyer.email, mobile: buyer.mobile } : null,
    items,
  };
}

/** Resolves a download token to the material it unlocks. Used by the download route. */
export async function entitlementForToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const [row] = await db
    .select({
      materialId: OI.materialId,
      expiresAt: OI.tokenExpiresAt,
      orderStatus: O.status,
      slug: M.slug,
      fileUrl: M.fileUrl,
      fileName: M.fileName,
    })
    .from(OI)
    .innerJoin(O, eq(O.id, OI.orderId))
    .innerJoin(M, eq(M.id, OI.materialId))
    .where(eq(OI.downloadToken, token));

  if (!row || row.orderStatus !== 'Completed') return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
