'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { paymentsApi, purchasedDownloadUrl, type Receipt } from '@/lib/paymentsClient';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const T = {
  mr: {
    successBadge: 'पेमेंट यशस्वी झाले',
    pendingBadge: 'पेमेंटची पडताळणी सुरू आहे',
    successTitle: 'अभिनंदन! तुमची डिजिटल लायब्ररी सक्रिय झाली आहे.',
    pendingTitle: 'तुमचे पेमेंट तपासले जात आहे.',
    orderNo: 'ऑर्डर क्रमांक',
    sentTo: 'पावती येथे पाठवली आहे',
    pendingHelp: 'बँकेकडून पुष्टी मिळताच डाऊनलोड लिंक येथे दिसेल. हे पान उघडे ठेवा किंवा थोड्या वेळाने परत या.',
    refresh: 'पुन्हा तपासा',
    purchased: 'तुमचे खरेदी केलेले साहित्य',
    download: 'PDF डाऊनलोड करा',
    noFile: 'PDF लवकरच उपलब्ध',
    locked: 'पेमेंट पूर्ण झाल्यावर उपलब्ध',
    paidVia: 'पेमेंट पद्धत',
    paymentId: 'पेमेंट आयडी',
    subtotal: 'एकूण किंमत',
    discount: 'सूट',
    total: 'भरलेली रक्कम',
    lifetime: 'कायमस्वरूपी प्रवेश — ही लिंक जपून ठेवा.',
    browse: 'इतर साहित्य ब्राउझ करा',
    notFound: 'ऑर्डर तपशील सापडला नाही',
    goMaterials: 'स्टडी मटेरियलकडे जा',
    loading: 'ऑर्डर उघडत आहे…',
  },
  en: {
    successBadge: 'Payment successful',
    pendingBadge: 'Verifying your payment',
    successTitle: 'All set! Your digital library is active.',
    pendingTitle: 'We are confirming your payment.',
    orderNo: 'Order number',
    sentTo: 'Receipt sent to',
    pendingHelp: 'Your download link appears here as soon as the bank confirms. Keep this page open or come back in a moment.',
    refresh: 'Check again',
    purchased: 'Your purchased materials',
    download: 'Download PDF',
    noFile: 'PDF coming soon',
    locked: 'Available once payment completes',
    paidVia: 'Paid via',
    paymentId: 'Payment ID',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Amount paid',
    lifetime: 'Lifetime access — keep this link safe.',
    browse: 'Browse more materials',
    notFound: 'Order not found',
    goMaterials: 'Go to study materials',
    loading: 'Loading your order…',
  },
  hi: {
    successBadge: 'भुगतान सफल',
    pendingBadge: 'भुगतान की पुष्टि हो रही है',
    successTitle: 'बधाई! आपकी डिजिटल लाइब्रेरी सक्रिय हो गई है।',
    pendingTitle: 'हम आपके भुगतान की पुष्टि कर रहे हैं।',
    orderNo: 'ऑर्डर संख्या',
    sentTo: 'रसीद भेजी गई',
    pendingHelp: 'बैंक की पुष्टि मिलते ही डाउनलोड लिंक यहां दिखेगा। यह पेज खुला रखें या थोड़ी देर बाद लौटें।',
    refresh: 'फिर जांचें',
    purchased: 'आपकी खरीदी गई सामग्री',
    download: 'PDF डाउनलोड करें',
    noFile: 'PDF शीघ्र उपलब्ध',
    locked: 'भुगतान पूरा होने पर उपलब्ध',
    paidVia: 'भुगतान माध्यम',
    paymentId: 'भुगतान आईडी',
    subtotal: 'कुल कीमत',
    discount: 'छूट',
    total: 'भुगतान राशि',
    lifetime: 'आजीवन एक्सेस — यह लिंक सुरक्षित रखें।',
    browse: 'अन्य सामग्री देखें',
    notFound: 'ऑर्डर नहीं मिला',
    goMaterials: 'स्टडी मटेरियल देखें',
    loading: 'ऑर्डर खुल रहा है…',
  },
};

/** Real receipt for a completed order, with the paid download links. */
export function OrderSuccessView() {
  const { viewParams, navigateTo, lang } = useApp();
  const t = T[lang] ?? T.mr;
  const { orderId, token } = viewParams;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  // Reset to true on mount — see the note in CheckoutView: a prior effect pass's
  // cleanup must not leave this stuck at false in React Strict Mode.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(() => {
    if (!orderId || !token) return Promise.resolve();
    return paymentsApi
      .receipt(orderId, token)
      .then((r) => {
        if (!mounted.current) return;
        setReceipt(r);
        setError('');
      })
      .catch((err) => mounted.current && setError((err as Error).message));
  }, [orderId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  // While the webhook is still confirming, poll briefly so the link appears on its own
  useEffect(() => {
    if (!receipt || receipt.paid) return;
    const id = setInterval(() => void load(), 5000);
    const stop = setTimeout(() => clearInterval(id), 60_000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [receipt, load]);

  const recheck = () => {
    setChecking(true);
    void load().finally(() => mounted.current && setChecking(false));
  };

  if (!orderId || !token || error) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 text-center px-4">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">{t.notFound}</h2>
        {error && <p className="text-xs text-slate-500 mt-1">{error}</p>}
        <button
          onClick={() => navigateTo('materials')}
          className="mt-4 px-4 py-2 bg-[#1C2C5B] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          {t.goMaterials}
        </button>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="bg-slate-50 min-h-screen py-20 text-center" role="status" aria-live="polite">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.loading}
        </p>
      </div>
    );
  }

  const paid = receipt.paid;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 text-left">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${
              paid ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {paid ? <CheckCircle2 className="w-8 h-8" aria-hidden="true" /> : <Clock className="w-8 h-8" aria-hidden="true" />}
          </div>

          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
              paid ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
            }`}
          >
            {paid ? t.successBadge : t.pendingBadge}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{paid ? t.successTitle : t.pendingTitle}</h1>

          <p className="text-xs sm:text-sm text-slate-500">
            {t.orderNo}: <strong className="text-slate-900 font-mono">{receipt.orderId}</strong>
            {receipt.buyer?.email && (
              <>
                {' • '}
                {t.sentTo} <strong className="text-slate-900">{receipt.buyer.email}</strong>
              </>
            )}
          </p>

          {!paid && (
            <div className="space-y-3">
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 max-w-lg mx-auto">
                {t.pendingHelp}
              </p>
              <button
                onClick={recheck}
                disabled={checking}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" /> {t.refresh}
              </button>
            </div>
          )}
        </div>

        {/* Purchased items + download links */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 pb-2 border-b border-slate-100">
            {t.purchased} ({receipt.items.length})
          </h3>

          <div className="space-y-3">
            {receipt.items.map((item) => (
              <div
                key={item.materialId}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{item.exam}</span>
                    <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-mono">₹{item.price}</p>
                  </div>
                </div>

                {item.downloadToken && item.hasFile ? (
                  <a
                    href={purchasedDownloadUrl(item.slug, item.downloadToken)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t.download}</span>
                  </a>
                ) : (
                  <span className="w-full sm:w-auto text-center px-5 py-2.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl shrink-0">
                    {!paid ? t.locked : t.noFile}
                  </span>
                )}
              </div>
            ))}
          </div>

          {paid && (
            <p className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              {t.lifetime}
            </p>
          )}
        </div>

        {/* Amounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>{t.subtotal}</span>
            <span className="font-mono text-slate-900 font-semibold">₹{receipt.subtotal}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>
                {t.discount}
                {receipt.couponCode ? ` (${receipt.couponCode})` : ''}
              </span>
              <span className="font-mono">−₹{receipt.discount}</span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-sm text-slate-900">
            <span>{t.total}</span>
            <span className="font-mono">₹{receipt.total}</span>
          </div>
          {paid && (receipt.paymentMethod || receipt.paymentId) && (
            <p className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100">
              {receipt.paymentMethod ? `${t.paidVia}: ${receipt.paymentMethod.toUpperCase()}` : ''}
              {receipt.paymentId ? ` • ${t.paymentId}: ${receipt.paymentId}` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigateTo('materials')}
            className="flex-1 py-3 bg-[#1C2C5B] hover:bg-blue-900 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>{t.browse}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
