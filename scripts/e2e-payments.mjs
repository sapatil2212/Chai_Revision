// End-to-end check of the Razorpay payment flow.
// Usage: node --env-file=.env scripts/e2e-payments.mjs [baseUrl]
//
// SAFETY: this never completes a real payment and never calls the Razorpay API with
// live keys. Order creation at the gateway only runs when RAZORPAY_KEY_ID is a
// rzp_test_ key. The paid-access path is proven through the signed webhook, which
// needs no gateway call at all.
import { createHmac, randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';

const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3100';
const ORIGIN = { Origin: BASE };
const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const IS_TEST_MODE = KEY_ID.startsWith('rzp_test_');
const BYPASS = process.env.ADMIN_SESSION_SECRET ? { 'x-e2e-bypass': process.env.ADMIN_SESSION_SECRET } : {};

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) failures++;
};

let cookie = '';
async function call(path, { method = 'GET', body, form, auth = true, headers = {}, origin = true } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(form ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(origin ? ORIGIN : {}),
      ...BYPASS,
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    redirect: 'manual',
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const text = buf.toString('utf8');
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, buf, headers: res.headers };
}

const marker = `PAY${Date.now()}`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
async function makePdf(pages = 3) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 420]).drawText(`Page ${i + 1}`, { x: 40, y: 380, size: 24 });
  return Buffer.from(await doc.save());
}
async function upload(buf, name, type, kind) {
  const form = new FormData();
  form.append('file', new Blob([buf], { type }), name);
  form.append('kind', kind);
  const res = await call('/api/admin/upload', { method: 'POST', form, headers: ORIGIN });
  if (!res.json?.ref) throw new Error(`upload of ${name} failed: ${res.json?.error || res.status}`);
  return res.json.ref;
}

console.log(`Razorpay mode: ${IS_TEST_MODE ? 'TEST' : KEY_ID.startsWith('rzp_live_') ? 'LIVE (gateway calls skipped)' : 'not configured'}`);

// ======================= Setup: an admin and a paid material with a PDF =======================
const login = await call('/api/admin/login', {
  method: 'POST',
  auth: false,
  headers: ORIGIN,
  body: { email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS },
});
check('admin login', login.status === 200, login.json?.error);
cookie = (login.headers.get('set-cookie') || '').split(';')[0];

const cover = await upload(PNG, 'cover.png', 'image/png', 'image');
const pdfRef = await upload(await makePdf(3), 'notes.pdf', 'application/pdf', 'pdf');
const created = await call('/api/admin/materials', {
  method: 'POST',
  headers: ORIGIN,
  body: {
    title: { en: `${marker} Paid Notes`, mr: `${marker} सशुल्क नोट्स` },
    description: { en: 'Paid material for the payment test' },
    exam: 'MPSC', subject: 'Indian Economy', language: 'Bilingual', materialType: 'PDF Notes',
    coverImage: cover, samplePages: [], pages: 3,
    originalPrice: 300, discountedPrice: 199,
    fileUrl: pdfRef, fileName: 'notes.pdf', fileSize: '0.1 MB',
    tableOfContents: ['One'], whatIsIncluded: ['PDF'], tags: ['test'],
    isPublished: true,
  },
});
const paid = created.json?.item;
check('paid material created with a PDF', created.status === 201 && !!paid?.id && paid.hasFile === true, created.json?.error);

const freeMat = await call('/api/admin/materials', {
  method: 'POST',
  headers: ORIGIN,
  body: {
    title: { en: `${marker} Free Guide` },
    description: { en: 'Free material' },
    exam: 'MPSC', subject: 'Indian Economy', language: 'English', materialType: 'Study Guides',
    // Temp upload refs are consumed when a material is saved, so each needs its own
    coverImage: await upload(PNG, 'cover2.png', 'image/png', 'image'),
    samplePages: [], pages: 2, originalPrice: 0, discountedPrice: 0, isFree: true,
    tableOfContents: [], whatIsIncluded: [], tags: [], isPublished: true,
  },
});
check('free material created', freeMat.status === 201, freeMat.json?.error);
const free = freeMat.json.item;

// A coupon we control, plus one that must be refused
const COUPON = `${marker}OK`.slice(0, 32).toUpperCase();
const EXPIRED = `${marker}EXP`.slice(0, 32).toUpperCase();
const { default: mysql } = await import('mysql2/promise');
const conn = await mysql.createConnection(process.env.DATABASE_URL);
await conn.query(
  'INSERT INTO coupons (code, discount_percent, max_uses, used_count, expires_at, is_active) VALUES (?,?,?,?,?,?)',
  [COUPON, 25, 5, 0, null, true]
);
await conn.query(
  'INSERT INTO coupons (code, discount_percent, max_uses, used_count, expires_at, is_active) VALUES (?,?,?,?,?,?)',
  [EXPIRED, 50, null, 0, new Date(Date.now() - 86400000), true]
);

// ======================= Quote: the server owns the price =======================
const anon = { auth: false, headers: ORIGIN };
check('quote rejects an empty cart', (await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [] } })).status === 400);
check('quote rejects an unknown material', (await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: ['mat-nope'] } })).status === 400);
check('quote rejects free materials', (await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [free.id] } })).status === 400);
check('quote blocks cross-origin requests', (await call('/api/payments/quote', { method: 'POST', auth: false, origin: false, headers: { Origin: 'https://evil.example' }, body: { materialIds: [paid.id] } })).status === 403);

const q1 = await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id] } });
check('quote prices from the database', q1.status === 200 && q1.json.subtotal === 199 && q1.json.total === 199, JSON.stringify({ s: q1.json?.subtotal, t: q1.json?.total }));
check('quote reports whether payments are configured', typeof q1.json.paymentsEnabled === 'boolean');

const q2 = await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id], couponCode: COUPON } });
check('valid coupon discounts server-side', q2.json.discount === 50 && q2.json.total === 149 && q2.json.coupon.discountPercent === 25, JSON.stringify({ d: q2.json?.discount, t: q2.json?.total }));
const q3 = await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id], couponCode: EXPIRED } });
check('expired coupon refused with a reason', q3.json.discount === 0 && /expired/i.test(q3.json.couponError || ''), q3.json?.couponError);
const q4 = await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id], couponCode: 'NOSUCHCODE' } });
check('unknown coupon refused with a reason', q4.json.discount === 0 && !!q4.json.couponError, q4.json?.couponError);
// The old client-side coupons must no longer buy a discount
const q5 = await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id], couponCode: 'CHAI10' } });
check('hardcoded client coupon no longer works unless it is in the DB', q5.json.discount === 0 || !!q5.json.coupon, q5.json?.couponError);
check('duplicate ids are de-duplicated', (await call('/api/payments/quote', { ...anon, method: 'POST', body: { materialIds: [paid.id, paid.id] } })).json.items.length === 1);

// ======================= Entitlement before any payment =======================
check('paid PDF is not downloadable without a token', (await call(`/api/materials/${paid.slug}/download`, anon)).status === 403);
check('paid PDF rejects a made-up token', (await call(`/api/materials/${paid.slug}/download?token=${'a'.repeat(48)}`, anon)).status === 403);
check('paid PDF rejects a malformed token', (await call(`/api/materials/${paid.slug}/download?token=short`, anon)).status === 403);

// ======================= Checkout validation =======================
const buyer = { name: 'Test Buyer', email: `${marker.toLowerCase()}@example.com`, mobile: '9876543210' };
const co = (body) => call('/api/payments/checkout', { ...anon, method: 'POST', body });
check('checkout needs a buyer name', (await co({ materialIds: [paid.id], buyer: { ...buyer, name: 'X' } })).status === 400);
check('checkout needs a valid email', (await co({ materialIds: [paid.id], buyer: { ...buyer, email: 'nope' } })).status === 400);
check('checkout needs a valid mobile', (await co({ materialIds: [paid.id], buyer: { ...buyer, mobile: '12345' } })).status === 400);
check('checkout rejects free materials', (await co({ materialIds: [free.id], buyer })).status === 400);

// ======================= Order + webhook-granted access =======================
// Build the order directly in the DB so no gateway call is needed with live keys.
const orderId = `CR-TEST-${randomUUID().slice(0, 8).toUpperCase()}`;
const rzpOrderId = `order_${marker}`;
const paymentId = `pay_${marker}`;
const userId = randomUUID();
await conn.query(
  'INSERT INTO users (id, name, email, mobile, role, preferred_language, target_exams) VALUES (?,?,?,?,?,?,?)',
  [userId, buyer.name, buyer.email, buyer.mobile, 'student', 'mr', JSON.stringify([])]
);
await conn.query(
  `INSERT INTO orders (id, user_id, subtotal, discount, total_amount, coupon_code, status, payment_provider, payment_order_id)
   VALUES (?,?,?,?,?,?,?,?,?)`,
  [orderId, userId, 199, 50, 149, COUPON, 'Pending', 'razorpay', rzpOrderId]
);
await conn.query('INSERT INTO order_items (order_id, material_id, price_at_purchase) VALUES (?,?,?)', [orderId, paid.id, 199]);

const hook = (payload, secret = WEBHOOK_SECRET) => {
  const raw = JSON.stringify(payload);
  return call('/api/payments/webhook', {
    method: 'POST',
    auth: false,
    origin: false,
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': createHmac('sha256', secret).update(raw).digest('hex') },
    form: raw, // send the exact bytes we signed
  });
};
const capturedEvent = (amountPaise = 14900) => ({
  event: 'payment.captured',
  payload: { payment: { entity: { id: paymentId, order_id: rzpOrderId, amount: amountPaise, method: 'upi' } } },
});

check('webhook rejects a missing signature', (await call('/api/payments/webhook', { method: 'POST', auth: false, origin: false, headers: { 'Content-Type': 'application/json' }, form: JSON.stringify(capturedEvent()) })).status === 400);
check('webhook rejects a wrong signature', (await hook(capturedEvent(), 'not-the-secret')).status === 400);

const [[beforePaid]] = await conn.query('SELECT status FROM orders WHERE id = ?', [orderId]);
check('order is still Pending before a valid webhook', beforePaid.status === 'Pending');

const mismatched = await hook(capturedEvent(99900));
check('webhook ignores an amount mismatch', mismatched.status === 200 && mismatched.json.ignored === 'amount mismatch', JSON.stringify(mismatched.json));
const [[stillPending]] = await conn.query('SELECT status FROM orders WHERE id = ?', [orderId]);
check('amount mismatch did not grant access', stillPending.status === 'Pending');

const ok = await hook(capturedEvent());
check('valid webhook marks the order paid', ok.status === 200 && ok.json.orderId === orderId && ok.json.alreadyPaid === false, JSON.stringify(ok.json));
const replay = await hook(capturedEvent());
check('replaying the webhook is idempotent', replay.status === 200 && replay.json.alreadyPaid === true);

const [[paidRow]] = await conn.query('SELECT status, payment_id, payment_method, paid_at FROM orders WHERE id = ?', [orderId]);
check('order recorded the payment details', paidRow.status === 'Completed' && paidRow.payment_id === paymentId && paidRow.payment_method === 'upi' && !!paidRow.paid_at, JSON.stringify(paidRow));
const [[couponRow]] = await conn.query('SELECT used_count FROM coupons WHERE code = ?', [COUPON]);
check('coupon usage counted exactly once despite the replay', couponRow.used_count === 1, String(couponRow.used_count));

const [tokens] = await conn.query('SELECT download_token FROM order_items WHERE order_id = ?', [orderId]);
const dlToken = tokens[0].download_token;
check('a download token was issued', /^[a-f0-9]{48}$/.test(dlToken || ''), dlToken ? `${dlToken.slice(0, 8)}…` : 'none');

// ======================= Paid download with the token =======================
const dl = await call(`/api/materials/${paid.slug}/download?token=${dlToken}`, anon);
check('paid PDF downloads with a valid token', dl.status === 200 && dl.buf.toString('ascii', 0, 5) === '%PDF-', String(dl.status));
check('paid download is served as an attachment', /attachment/.test(dl.headers.get('content-disposition') || ''));
const other = await call('/api/admin/materials', {
  method: 'POST',
  headers: ORIGIN,
  body: {
    title: { en: `${marker} Other Paid` }, description: { en: 'Another paid item' },
    exam: 'MPSC', subject: 'Indian Economy', language: 'English', materialType: 'PDF Notes',
    coverImage: await upload(PNG, 'cover3.png', 'image/png', 'image'),
    samplePages: [], pages: 2, originalPrice: 100, discountedPrice: 99,
    fileUrl: await upload(await makePdf(2), 'other.pdf', 'application/pdf', 'pdf'), fileName: 'other.pdf',
    tableOfContents: [], whatIsIncluded: [], tags: [], isPublished: true,
  },
});
check('token from one order cannot unlock another paid material', (await call(`/api/materials/${other.json.item.slug}/download?token=${dlToken}`, anon)).status === 403);

// ======================= Receipt is token-gated =======================
const badReceipt = await call(`/api/payments/orders/${orderId}?token=wrong`, anon);
check('receipt rejects a wrong order token', badReceipt.status === 401);
check('receipt rejects a missing order token', (await call(`/api/payments/orders/${orderId}`, anon)).status === 401);

// Derive the receipt token the same way the server does
const receiptToken = createHmac('sha256', process.env.QUIZ_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET)
  .update(`order:${orderId}`)
  .digest('base64url');
const receipt = await call(`/api/payments/orders/${orderId}?token=${encodeURIComponent(receiptToken)}`, anon);
check('receipt returns the paid order', receipt.status === 200 && receipt.json.paid === true && receipt.json.total === 149, JSON.stringify({ paid: receipt.json?.paid, total: receipt.json?.total }));
check('receipt exposes the download token only when paid', receipt.json.items[0].downloadToken === dlToken);
check('receipt includes the buyer contact', receipt.json.buyer?.email === buyer.email);
check('receipt never leaks the storage path', !receipt.text.includes('pdfs/'));

// ======================= Verify endpoint rejects forged signatures =======================
const forged = await call('/api/payments/verify', {
  ...anon,
  method: 'POST',
  body: { orderId, razorpayPaymentId: paymentId, razorpaySignature: 'deadbeef' },
});
check('verify on an already-paid order stays safe', forged.status === 200 && forged.json.paid === true, String(forged.status));

// A fresh Pending order proves a bad signature is refused
const order2 = `CR-TEST-${randomUUID().slice(0, 8).toUpperCase()}`;
await conn.query(
  `INSERT INTO orders (id, user_id, subtotal, discount, total_amount, status, payment_provider, payment_order_id)
   VALUES (?,?,?,?,?,?,?,?)`,
  [order2, userId, 199, 0, 199, 'Pending', 'razorpay', `order_${marker}_2`]
);
await conn.query('INSERT INTO order_items (order_id, material_id, price_at_purchase) VALUES (?,?,?)', [order2, paid.id, 199]);
const badSig = await call('/api/payments/verify', {
  ...anon,
  method: 'POST',
  body: { orderId: order2, razorpayPaymentId: 'pay_forged', razorpaySignature: 'f'.repeat(64) },
});
check('verify refuses a forged checkout signature', badSig.status === 400, String(badSig.status));
const [[failedRow]] = await conn.query('SELECT status FROM orders WHERE id = ?', [order2]);
check('a forged signature marks the order Failed, not paid', failedRow.status === 'Failed', failedRow.status);
const [tok2] = await conn.query('SELECT download_token FROM order_items WHERE order_id = ?', [order2]);
check('no download token issued for an unpaid order', tok2[0].download_token === null);

// A real signature over a payment that does not exist must still fail at the gateway check
const realSig = createHmac('sha256', KEY_SECRET).update(`order_${marker}_2|pay_ghost`).digest('hex');
await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['Pending', order2]);
const ghost = await call('/api/payments/verify', {
  ...anon,
  method: 'POST',
  body: { orderId: order2, razorpayPaymentId: 'pay_ghost', razorpaySignature: realSig },
});
check('a correctly signed but non-existent payment is still refused', ghost.status >= 400, String(ghost.status));

// ======================= Gateway order creation (test keys only) =======================
if (IS_TEST_MODE) {
  const live = await call('/api/payments/checkout', { ...anon, method: 'POST', body: { materialIds: [paid.id], buyer, couponCode: COUPON } });
  check('checkout creates a gateway order', live.status === 200 && /^order_/.test(live.json.razorpayOrderId || ''), live.json?.error);
  check('gateway order amount matches the server quote', live.json?.amountPaise === 14900, String(live.json?.amountPaise));
  check('checkout returns the public key id only', live.json?.keyId === KEY_ID && !live.text.includes(KEY_SECRET));
  check('checkout hands back an order token', !!live.json?.orderToken);
  if (live.json?.orderId) await conn.query('DELETE FROM orders WHERE id = ?', [live.json.orderId]);
} else {
  console.log('SKIP  gateway order creation (needs rzp_test_ keys; refusing to touch a live account)');
  check('live secret is never sent to the browser', !q1.text.includes(KEY_SECRET) && !receipt.text.includes(KEY_SECRET));
}

// ======================= Cleanup =======================
await conn.query('DELETE FROM orders WHERE id IN (?, ?)', [orderId, order2]);
await conn.query('DELETE FROM users WHERE id = ?', [userId]);
await conn.query('DELETE FROM coupons WHERE code IN (?, ?)', [COUPON, EXPIRED]);
await conn.end();

for (const id of [paid.id, free.id, other.json?.item?.id].filter(Boolean)) {
  await call(`/api/admin/materials/${id}`, { method: 'DELETE', headers: ORIGIN });
}
check('test materials removed', (await call(`/api/admin/materials/${paid.id}`)).status === 404);

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
