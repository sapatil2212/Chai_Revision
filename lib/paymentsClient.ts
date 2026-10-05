// Browser client for checkout + the Razorpay Checkout popup.
//
// The browser never computes a price and never touches card data: amounts come from
// /api/payments/quote, and card entry happens inside Razorpay's own iframe.

export class PaymentError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PaymentError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return data as T;
}

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
  couponError: string | null;
  paymentsEnabled: boolean;
}

export interface Buyer {
  name: string;
  email: string;
  mobile: string;
}

export interface CheckoutSession {
  orderId: string;
  orderToken: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  buyer: Buyer;
  quote: Omit<Quote, 'paymentsEnabled'>;
}

export interface ReceiptItem {
  materialId: string;
  slug: string;
  title: string;
  exam: string;
  price: number;
  downloadToken: string | null;
  hasFile: boolean;
}

export interface Receipt {
  orderId: string;
  status: string;
  paid: boolean;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  buyer: Buyer | null;
  items: ReceiptItem[];
}

export const paymentsApi = {
  quote: (materialIds: string[], couponCode?: string) =>
    call<Quote>('/api/payments/quote', { method: 'POST', body: JSON.stringify({ materialIds, couponCode }) }),

  checkout: (materialIds: string[], buyer: Buyer, couponCode?: string) =>
    call<CheckoutSession>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ materialIds, buyer, couponCode }),
    }),

  verify: (orderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
    call<Receipt>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, razorpayPaymentId, razorpaySignature }),
    }),

  receipt: (orderId: string, token: string) =>
    call<Receipt>(`/api/payments/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`),
};

/** Paid download link for one purchased material. */
export const purchasedDownloadUrl = (slug: string, downloadToken: string) =>
  `/api/materials/${encodeURIComponent(slug)}/download?token=${encodeURIComponent(downloadToken)}`;

// ---------------------------------------------------------------------------
// Razorpay Checkout
// ---------------------------------------------------------------------------

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (payload: unknown) => void) => void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay's checkout script once and caches the promise. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in a browser'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const onError = () => {
      scriptPromise = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', onError);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = onError;
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface OpenCheckoutOptions {
  session: CheckoutSession;
  /** Fires after Razorpay hands back a signed success response. */
  onSuccess: (res: RazorpayHandlerResponse) => void;
  /** Fires when the customer closes the popup without paying. */
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

/** Opens Razorpay's hosted payment popup for an existing checkout session. */
export async function openRazorpayCheckout({ session, onSuccess, onDismiss, onFailure }: OpenCheckoutOptions) {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window is unavailable.');

  const rzp = new Razorpay({
    key: session.keyId,
    order_id: session.razorpayOrderId,
    amount: session.amountPaise,
    currency: session.currency,
    name: 'Chai Revision',
    description: `${session.quote.items.length} study material(s)`,
    image: '/images/cr-logo.png',
    prefill: {
      name: session.buyer.name,
      email: session.buyer.email,
      contact: session.buyer.mobile,
    },
    notes: { orderId: session.orderId },
    theme: { color: '#1C2C5B' },
    retry: { enabled: false },
    handler: (res: RazorpayHandlerResponse) => onSuccess(res),
    modal: { ondismiss: () => onDismiss() },
  });

  rzp.on('payment.failed', (payload: unknown) => {
    const description = (payload as { error?: { description?: string } })?.error?.description;
    onFailure(description || 'The payment did not go through. You have not been charged.');
  });

  rzp.open();
}
