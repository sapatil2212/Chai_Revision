'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  AlertCircle,
} from 'lucide-react';

export function CheckoutView() {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    createOrder,
    navigateTo,
    lang,
    t,
    user,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiOption, setUpiOption] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('gpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form details
  const [name, setName] = useState(user?.name || 'समीर देशपांडे');
  const [email, setEmail] = useState(user?.email || 'sameer.mpsc2026@gmail.com');
  const [mobile, setMobile] = useState(user?.mobile || '+91 98230 45678');

  if (cart.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">तुमची कार्ट रिकामी आहे</h2>
          <p className="text-xs text-slate-500">चेकआउट करण्यासाठी कृपया प्रथम अभ्यास साहित्य निवडा.</p>
          <button
            onClick={() => navigateTo('materials')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs shadow-blue-500/20"
          >
            साहित्य ब्राउझ करा
          </button>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;
    const ok = applyCoupon(couponCode);
    if (!ok) {
      setCouponError('अवैध कूपन. कृपया CHAI10 वापरा.');
    }
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const order = createOrder(
        paymentMethod === 'upi' ? `UPI (${upiOption.toUpperCase()})` : paymentMethod === 'card' ? 'Debit/Credit Card' : 'Net Banking'
      );
      setIsProcessing(false);
      navigateTo('order-success', { orderId: order.id });
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('materials')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>खरेदी सुरू ठेवा</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>२५६-बिट एसएसएल सुरक्षित पेमेंट</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Checkout Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Contact Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                १. संपर्क माहिती (Contact Details)
              </h3>
              <p className="text-xs text-slate-500">
                डिजिटल डाऊनलोड टोकन आणि पावती तुमच्या या ईमेल व मोबाईलवर पाठवली जाईल.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">विद्यार्थ्याचे पूर्ण नाव</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ईमेल पत्ता (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">मोबाईल नंबर (WhatsApp)</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                २. पेमेंट पद्धत निवडा (Select Payment Method)
              </h3>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>कार्ड (Card)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>नेटबँकिंग</span>
                </button>
              </div>

              {/* UPI Options */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-900 block">पसंतीचे UPI अॅप निवडा:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                    {[
                      { id: 'gpay', label: 'Google Pay' },
                      { id: 'phonepe', label: 'PhonePe' },
                      { id: 'paytm', label: 'Paytm' },
                      { id: 'qr', label: 'BHIM / Any QR' },
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUpiOption(u.id as any)}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          upiOption === u.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    &apos;पेमेंट करा&apos; वर क्लिक केल्यावर तुमच्या अॅपवर सुरक्षित पेमेंट विनंती पाठवली जाईल.
                  </p>
                </div>
              )}

              {/* Card Options */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3 text-xs animate-in fade-in">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">कार्ड नंबर</label>
                    <input
                      type="text"
                      placeholder="४१११ •••• •••• ११११"
                      defaultValue="4532 8912 3491 0021"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">महिना / वर्ष</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="08/29"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        defaultValue="891"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Netbanking */}
              {paymentMethod === 'netbanking' && (
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl text-xs animate-in fade-in">
                  <label className="font-bold text-slate-700 block mb-1">बँक निवडा</label>
                  <select className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-blue-600">
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Bank of Maharashtra</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right Order Summary & Pay Action (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 sticky top-24">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
                ऑर्डर सारांश ({cart.length} साहित्य)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.title[lang]}</p>
                      <p className="text-[11px] text-slate-500">{item.exam} • {item.pages} पृष्ठे</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {item.isFree ? 'मोफत' : `₹${item.discountedPrice}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="border-t border-slate-100 pt-3">
                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>कूपन {appliedCoupon} लागू झाले! (-१०%)</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      हटवा
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="कूपन कोड (उदा. CHAI10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      लागू करा
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-600 mt-1">{couponError}</p>
                )}
              </div>

              {/* Price Calculation Box */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>साहित्याची एकूण किंमत:</span>
                  <span className="text-slate-900 font-semibold">₹{cartSubtotal}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>सूट (Discount):</span>
                    <span>-₹{cartDiscount}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-base text-slate-900">
                  <span>अंतिम देय रक्कम:</span>
                  <span className="text-slate-900 font-black">₹{cartTotal}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <span>सुरक्षित पेमेंट प्रक्रिया सुरू आहे...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>₹{cartTotal} सुरक्षित पेमेंट करा</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>१००% सुरक्षित व्यवहार • झटपट डिजिटल प्रवेश</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
