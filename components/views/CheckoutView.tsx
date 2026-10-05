'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import {
  openRazorpayCheckout,
  paymentsApi,
  type Buyer,
  type CheckoutSession,
  type Quote,
} from '@/lib/paymentsClient';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tag,
} from 'lucide-react';

const T = {
  mr: {
    continueShopping: 'खरेदी सुरू ठेवा',
    secure: 'सुरक्षित पेमेंट (Razorpay)',
    emptyTitle: 'तुमची कार्ट रिकामी आहे',
    emptySub: 'चेकआउट करण्यासाठी कृपया प्रथम अभ्यास साहित्य निवडा.',
    browse: 'साहित्य ब्राउझ करा',
    contact: '१. संपर्क माहिती',
    contactSub: 'पावती आणि सुरक्षित डाऊनलोड लिंक या ईमेलवर पाठवली जाईल.',
    name: 'पूर्ण नाव',
    email: 'ईमेल पत्ता',
    mobile: 'मोबाईल नंबर',
    namePh: 'उदा. राहुल पाटील',
    emailPh: 'उदा. rahul@gmail.com',
    mobilePh: '१० अंकी मोबाईल क्रमांक',
    errName: 'कृपया तुमचे पूर्ण नाव लिहा.',
    errEmail: 'कृपया वैध ईमेल पत्ता लिहा.',
    errMobile: 'कृपया वैध १० अंकी मोबाईल क्रमांक लिहा.',
    required: 'आवश्यक',
    payTitle: '२. पेमेंट',
    payVia: 'पेमेंट Razorpay द्वारे सुरक्षितपणे होते — UPI, कार्ड, नेटबँकिंग व वॉलेट.',
    pciNote: 'तुमचे कार्ड किंवा UPI तपशील Chai Revision कधीही साठवत नाही. ते थेट Razorpay च्या सुरक्षित विंडोमध्ये भरले जातात.',
    summary: 'ऑर्डर सारांश',
    items: 'साहित्य',
    pages: 'पृष्ठे',
    couponPh: 'कूपन कोड',
    apply: 'लागू करा',
    remove: 'हटवा',
    couponOn: 'लागू झाले',
    subtotal: 'साहित्याची एकूण किंमत',
    discount: 'सूट (Discount)',
    total: 'अंतिम देय रक्कम',
    pay: 'सुरक्षित पेमेंट करा',
    processing: 'पेमेंट विंडो उघडत आहे…',
    verifying: 'पेमेंटची पडताळणी सुरू आहे…',
    trust: '१००% सुरक्षित व्यवहार • झटपट डिजिटल प्रवेश',
    loading: 'किंमत तपासत आहे…',
    unavailable: 'ऑनलाइन पेमेंट सध्या उपलब्ध नाही. कृपया नंतर प्रयत्न करा.',
    dismissed: 'पेमेंट रद्द झाले. तुमच्याकडून कोणतेही शुल्क घेतले गेले नाही.',
    retry: 'पुन्हा प्रयत्न करा',
    notFoundTitle: 'हे साहित्य सध्या उपलब्ध नाही',
    notFoundSub: 'कदाचित ते काढून टाकले गेले आहे किंवा मोफत आहे. कृपया साहित्य विभाग पाहा.',
    orderNoShort: 'ऑर्डर',
    webhookBackstop: 'पैसे कापले गेले असल्यास तुमचा प्रवेश थोड्याच वेळात सक्रिय होईल.',
  },
  en: {
    continueShopping: 'Continue shopping',
    secure: 'Secure payment (Razorpay)',
    emptyTitle: 'Your cart is empty',
    emptySub: 'Pick some study material before checking out.',
    browse: 'Browse materials',
    contact: '1. Contact details',
    contactSub: 'Your receipt and secure download link are sent to this email.',
    name: 'Full name',
    email: 'Email address',
    mobile: 'Mobile number',
    namePh: 'e.g. Rahul Patil',
    emailPh: 'e.g. rahul@gmail.com',
    mobilePh: '10-digit mobile number',
    errName: 'Please enter your full name.',
    errEmail: 'Please enter a valid email address.',
    errMobile: 'Please enter a valid 10-digit mobile number.',
    required: 'required',
    payTitle: '2. Payment',
    payVia: 'Payment is handled securely by Razorpay — UPI, cards, net banking and wallets.',
    pciNote: 'Chai Revision never stores your card or UPI details. You enter them directly in Razorpay’s secure window.',
    summary: 'Order summary',
    items: 'item(s)',
    pages: 'pages',
    couponPh: 'Coupon code',
    apply: 'Apply',
    remove: 'Remove',
    couponOn: 'applied',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Amount payable',
    pay: 'Pay securely',
    processing: 'Opening the payment window…',
    verifying: 'Verifying your payment…',
    trust: '100% secure transaction • instant digital access',
    loading: 'Checking price…',
    unavailable: 'Online payment is unavailable right now. Please try again later.',
    dismissed: 'Payment cancelled. You have not been charged.',
    retry: 'Try again',
    notFoundTitle: 'This material is not available',
    notFoundSub: 'It may have been removed, or it is free. Browse the materials section.',
    orderNoShort: 'Order',
    webhookBackstop: 'if money was debited, your access will appear shortly.',
  },
  hi: {
    continueShopping: 'खरीदारी जारी रखें',
    secure: 'सुरक्षित भुगतान (Razorpay)',
    emptyTitle: 'आपकी कार्ट खाली है',
    emptySub: 'चेकआउट के लिए पहले अध्ययन सामग्री चुनें।',
    browse: 'सामग्री देखें',
    contact: '1. संपर्क विवरण',
    contactSub: 'रसीद और सुरक्षित डाउनलोड लिंक इसी ईमेल पर भेजा जाएगा।',
    name: 'पूरा नाम',
    email: 'ईमेल पता',
    mobile: 'मोबाइल नंबर',
    namePh: 'उदा. राहुल पाटील',
    emailPh: 'उदा. rahul@gmail.com',
    mobilePh: '10 अंकों का मोबाइल नंबर',
    errName: 'कृपया अपना पूरा नाम दर्ज करें।',
    errEmail: 'कृपया वैध ईमेल पता दर्ज करें।',
    errMobile: 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।',
    required: 'आवश्यक',
    payTitle: '2. भुगतान',
    payVia: 'भुगतान Razorpay द्वारा सुरक्षित रूप से होता है — UPI, कार्ड, नेटबैंकिंग एवं वॉलेट।',
    pciNote: 'Chai Revision आपके कार्ड या UPI विवरण कभी संग्रहित नहीं करता। वे सीधे Razorpay की सुरक्षित विंडो में भरे जाते हैं।',
    summary: 'ऑर्डर सारांश',
    items: 'सामग्री',
    pages: 'पृष्ठ',
    couponPh: 'कूपन कोड',
    apply: 'लागू करें',
    remove: 'हटाएं',
    couponOn: 'लागू',
    subtotal: 'कुल कीमत',
    discount: 'छूट',
    total: 'देय राशि',
    pay: 'सुरक्षित भुगतान करें',
    processing: 'भुगतान विंडो खुल रही है…',
    verifying: 'भुगतान की पुष्टि हो रही है…',
    trust: '100% सुरक्षित लेनदेन • तत्काल डिजिटल एक्सेस',
    loading: 'कीमत जांची जा रही है…',
    unavailable: 'ऑनलाइन भुगतान अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।',
    dismissed: 'भुगतान रद्द। आपसे कोई शुल्क नहीं लिया गया।',
    retry: 'पुनः प्रयास करें',
    notFoundTitle: 'यह सामग्री उपलब्ध नहीं है',
    notFoundSub: 'यह हटा दी गई हो सकती है या मुफ्त है। कृपया सामग्री अनुभाग देखें।',
    orderNoShort: 'ऑर्डर',
    webhookBackstop: 'यदि राशि कटी है तो आपका एक्सेस शीघ्र सक्रिय हो जाएगा।',
  },
};

const normalizeMobile = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};

/**
 * Checkout. Totals are fetched from the server and card entry happens inside
 * Razorpay's own window, so this component never sees payment instrument data.
 */
export function CheckoutView() {
  const { viewParams, materials, recordPurchase, navigateTo, lang } = useApp();
  const t = T[lang] ?? T.mr;

  // Direct single-item purchase: the material to buy comes from the URL, not a cart.
  const product = materials.find((p) => p.slug === viewParams.slug);
  const purchasable = product && !product.isFree;

  // Start blank: there is no real signed-in buyer yet, so each purchaser enters
  // their own details rather than inheriting the demo profile.
  const [buyer, setBuyer] = useState<Buyer>({ name: '', email: '', mobile: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Buyer, string>>>({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [stage, setStage] = useState<'idle' | 'creating' | 'verifying'>('idle');
  const [payError, setPayError] = useState('');
  const [notice, setNotice] = useState('');
  // Bumped to force a re-fetch (retry button / coupon change)
  const [reloadKey, setReloadKey] = useState(0);

  // Tracks whether this component is still mounted, so a slow response from an
  // unmounted view is dropped. Reset to true on mount because React may re-run
  // effects (Strict Mode) and the cleanup from a prior pass would otherwise
  // leave this stuck at false.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const ids = purchasable ? [product!.id] : [];
  const idsKey = ids.join(',');

  // The server is the only source of prices. Each run is scoped to its own request
  // so an in-flight quote cannot overwrite a newer one. idsKey always holds one
  // product here (the no-product case is handled by an earlier return).
  useEffect(() => {
    let current = true;
    paymentsApi
      .quote(idsKey.split(','), coupon)
      .then((q) => {
        if (!current || !mounted.current) return;
        setQuote(q);
        setQuoteError('');
        // A rejected coupon should not keep re-sending on every render
        if (q.couponError) setCoupon('');
      })
      .catch((err) => {
        if (current && mounted.current) setQuoteError((err as Error).message);
      })
      .finally(() => {
        if (current && mounted.current) setQuoteLoading(false);
      });
    return () => {
      current = false;
    };
  }, [idsKey, coupon, reloadKey]);

  // Re-fetch the quote (retry after an error, or after the coupon changes)
  const refetchQuote = () => {
    setQuoteError('');
    setQuoteLoading(true);
    setReloadKey((k) => k + 1);
  };

  const validate = () => {
    const found: Partial<Record<keyof Buyer, string>> = {};
    if (buyer.name.trim().length < 2) found.name = t.errName;
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(buyer.email.trim())) found.email = t.errEmail;
    if (!/^[6-9]\d{9}$/.test(normalizeMobile(buyer.mobile))) found.mobile = t.errMobile;
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const finish = (session: CheckoutSession) => {
    if (product) recordPurchase([product]);
    navigateTo('order-success', { orderId: session.orderId, token: session.orderToken });
  };

  const pay = async () => {
    setPayError('');
    setNotice('');
    if (!validate()) return;
    if (!quote || quote.total < 1) return;

    setStage('creating');
    let session: CheckoutSession;
    try {
      session = await paymentsApi.checkout(ids, { ...buyer, mobile: normalizeMobile(buyer.mobile) }, coupon);
    } catch (err) {
      setStage('idle');
      return setPayError((err as Error).message);
    }

    try {
      await openRazorpayCheckout({
        session,
        onSuccess: (res) => {
          setStage('verifying');
          // Access is granted by the server only after it re-checks with Razorpay
          paymentsApi
            .verify(session.orderId, res.razorpay_payment_id, res.razorpay_signature)
            .then(() => finish(session))
            .catch((err) => {
              if (!mounted.current) return;
              setStage('idle');
              // The webhook is the backstop, so point the buyer at their receipt
              setPayError(
                `${(err as Error).message} (${t.orderNoShort} ${session.orderId}) — ${t.webhookBackstop}`
              );
            });
        },
        onDismiss: () => {
          if (!mounted.current) return;
          setStage('idle');
          setNotice(t.dismissed);
        },
        onFailure: (message) => {
          if (!mounted.current) return;
          setStage('idle');
          setPayError(message);
        },
      });
    } catch (err) {
      setStage('idle');
      setPayError((err as Error).message);
    }
  };

  // No valid paid material to buy (bad link, removed, or free)
  if (!purchasable) {
    return (
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
            <Lock className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t.notFoundTitle}</h2>
          <p className="text-xs text-slate-500">{t.notFoundSub}</p>
          <button
            onClick={() => navigateTo('materials')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {t.browse}
          </button>
        </div>
      </div>
    );
  }

  const busy = stage !== 'idle';
  const field = (key: keyof Buyer, label: string, type: string, autoComplete: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`co-${key}`} className="font-bold text-slate-700 block mb-1">
        {label} <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
        <span className="sr-only">({t.required})</span>
      </label>
      <input
        id={`co-${key}`}
        type={type}
        autoComplete={autoComplete}
        value={buyer[key]}
        onChange={(e) => {
          const v = e.target.value;
          setBuyer((b) => ({ ...b, [key]: v }));
          if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `co-${key}-err` : undefined}
        className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:bg-white ${
          errors[key] ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600'
        }`}
        {...extra}
      />
      {errors[key] && (
        <p id={`co-${key}-err`} className="text-[11px] text-rose-600 mt-1">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigateTo('materials', { slug: product!.slug })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{t.continueShopping}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>{t.secure}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Buyer details + payment explainer */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{t.contact}</h3>
              <p className="text-xs text-slate-500">{t.contactSub}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">{field('name', t.name, 'text', 'name', { maxLength: 80, placeholder: t.namePh })}</div>
                {field('email', t.email, 'email', 'email', { maxLength: 191, placeholder: t.emailPh })}
                {field('mobile', t.mobile, 'tel', 'tel', { maxLength: 15, inputMode: 'numeric', placeholder: t.mobilePh })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{t.payTitle}</h3>
              <p className="text-xs text-slate-600">{t.payVia}</p>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                {[
                  { icon: <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />, label: 'UPI / QR' },
                  { icon: <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Card' },
                  { icon: <Lock className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Net banking' },
                  { icon: <Tag className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Wallets' },
                ].map((m) => (
                  <span
                    key={m.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    {m.icon}
                    {m.label}
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" aria-hidden="true" />
                {t.pciNote}
              </p>
            </div>
          </div>

          {/* Server-computed summary */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 sticky top-24">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
                {t.summary} ({quote ? quote.items.length : 1} {t.items})
              </h3>

              {/* Quote failed to load: show why and let the buyer retry */}
              {quoteError && (
                <div className="py-2 space-y-3">
                  <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" /> {quoteError}
                  </p>
                  <button
                    onClick={refetchQuote}
                    disabled={quoteLoading}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? 'animate-spin' : ''}`} aria-hidden="true" /> {t.retry}
                  </button>
                </div>
              )}

              {/* First load in progress */}
              {!quote && !quoteError && quoteLoading && (
                <p className="text-xs text-slate-400 flex items-center gap-2 py-4">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> {t.loading}
                </p>
              )}

              {quote && !quoteError && (
                <>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
                    {quote.items.map((item) => (
                      <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.exam} • {item.pages} {t.pages}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon — validated server-side */}
                  <div className="border-t border-slate-100 pt-3">
                    {quote.coupon ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                          {quote.coupon.code} {t.couponOn} (−{quote.coupon.discountPercent}%)
                        </span>
                        <button
                          onClick={() => {
                            setCoupon('');
                            setCouponInput('');
                            setQuoteLoading(true);
                          }}
                          className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                        >
                          {t.remove}
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setCoupon(couponInput.trim().toUpperCase());
                          setQuoteLoading(true);
                        }}
                        className="flex gap-2"
                      >
                        <label htmlFor="co-coupon" className="sr-only">
                          {t.couponPh}
                        </label>
                        <input
                          id="co-coupon"
                          value={couponInput}
                          maxLength={32}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder={t.couponPh}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          {t.apply}
                        </button>
                      </form>
                    )}
                    {quote.couponError && <p className="text-[11px] text-rose-600 mt-1">{quote.couponError}</p>}
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>{t.subtotal}</span>
                      <span className="text-slate-900 font-semibold font-mono">₹{quote.subtotal}</span>
                    </div>
                    {quote.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>{t.discount}</span>
                        <span className="font-mono">−₹{quote.discount}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-base text-slate-900">
                      <span>{t.total}</span>
                      <span className="font-mono">₹{quote.total}</span>
                    </div>
                  </div>

                  {notice && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2" role="status">
                      {notice}
                    </p>
                  )}
                  {payError && (
                    <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-2" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" /> {payError}
                    </p>
                  )}

                  {quote.paymentsEnabled ? (
                    <button
                      onClick={pay}
                      disabled={busy || quote.total < 1}
                      className="w-full py-3.5 bg-[#1C2C5B] hover:bg-blue-900 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {busy ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>{stage === 'verifying' ? t.verifying : t.processing}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" aria-hidden="true" />
                          <span>₹{quote.total} {t.pay}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center font-semibold">
                      {t.unavailable}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>{t.trust}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
