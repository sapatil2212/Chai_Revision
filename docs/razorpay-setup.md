# Razorpay setup

How payments are wired up, and what to configure in the Razorpay dashboard.

## 1. Environment variables

In `.env` (never committed — `.gitignore` covers `.env*`):

```
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx      # or rzp_test_... while developing
RAZORPAY_KEY_SECRET=...                # server only
RAZORPAY_WEBHOOK_SECRET=...            # a secret you choose, also set in the dashboard
```

`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must never reach the browser.
The public key id is returned by `/api/payments/checkout`, so there is no
`NEXT_PUBLIC_*` payment variable to leak.

Checkout is hidden automatically when the key pair is absent, so a missing
configuration shows "payment unavailable" rather than a broken button.

## 2. Register the webhook

Razorpay dashboard → **Settings → Webhooks → Add New Webhook**:

| Field | Value |
| --- | --- |
| Webhook URL | `https://<your-domain>/api/payments/webhook` |
| Secret | exactly the same string as `RAZORPAY_WEBHOOK_SECRET` |
| Active events | `payment.captured`, `payment.failed`, `order.paid` |

The endpoint must be publicly reachable over HTTPS. `localhost` will not work —
use a tunnel (for example `cloudflared tunnel --url http://localhost:3000`) when
testing locally and register the tunnel URL.

### Why the webhook matters

The browser callback is a convenience, not the source of truth. If the buyer
closes the tab the moment after paying, the webhook is what marks the order paid
and issues the download token. Both paths call the same idempotent
`markOrderPaid()`, so whichever arrives first wins and the second is a no-op.

A non-2xx response makes Razorpay retry, so transient database errors return
`500` on purpose. An invalid signature returns `400` and is never retried.

## 3. Payment flow

```
browser                          server                        Razorpay
   |  POST /api/payments/quote      |                               |
   |------------------------------->|  price recomputed from DB     |
   |<-------------------------------|                               |
   |  POST /api/payments/checkout   |                               |
   |------------------------------->|  insert order (Pending)       |
   |                                |------ create order ---------->|
   |<------ keyId + order id -------|                               |
   |  Razorpay Checkout popup (card data never touches our servers) |
   |---------------------------------------------------------------->|
   |<---- razorpay_payment_id + signature ---------------------------|
   |  POST /api/payments/verify     |                               |
   |------------------------------->|  verify HMAC signature        |
   |                                |------ fetch payment --------->|
   |                                |  check order + amount + state |
   |                                |  mark paid, issue token       |
   |<------------ receipt ----------|                               |
                                    |<===== webhook (backstop) =====|
```

## 4. What is enforced server-side

- **Prices.** Every amount is recomputed from the `materials` table in
  `quoteCart()`. A tampered cart cannot change what is charged.
- **Coupons.** Validated against the `coupons` table: active, not expired, under
  its `maxUses`. `usedCount` is incremented once, when the order is paid.
- **Free materials** are rejected at checkout — they are downloads, not purchases.
- **Entitlement.** A paid PDF needs `?token=<downloadToken>`, issued only after a
  verified payment and checked against the order status and the material id.
- **Receipts** require the order token handed out at checkout, so knowing an
  order id is not enough to read someone else's purchase.
- **Amount match.** `confirmCheckout()` and the webhook both compare the paid
  amount against the stored order total before granting access.

## 5. Going live

1. Swap the test keys for live keys in `.env` and restart.
2. Re-register the webhook against the production domain (the secret can stay).
3. Confirm Razorpay's dashboard shows the webhook as active, then make one small
   real purchase end to end and check that:
   - the order appears as `Completed` in the `orders` table,
   - the download link works,
   - the superadmin dashboard revenue card shows the amount.
4. Rotate `RAZORPAY_KEY_SECRET` if it has ever been shared outside the server
   (chat, screenshots, tickets). Dashboard → API Keys → Regenerate.
