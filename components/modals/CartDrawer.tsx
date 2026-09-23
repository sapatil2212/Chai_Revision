'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { X, Trash2, ShoppingBag, ShieldCheck, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    navigateTo,
    lang,
    t,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponMsg('कूपन यशस्वीरीत्या लागू झाले (१०% सूट)!');
    } else {
      setCouponMsg('अवैध कूपन कोड. कृपया CHAI10 किंवा MPSC2026 वापरा.');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">{t.checkout.cartTitle}</h3>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-base text-slate-900">{t.checkout.emptyCart}</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">{t.checkout.emptyCartMsg}</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('materials');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs shadow-blue-500/20"
              >
                {t.checkout.browseMaterials}
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 relative group"
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title[lang]}
                      className="w-14 h-18 object-cover rounded-lg shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-6">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {item.exam} • {item.materialType}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                        {item.title[lang]}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">{item.pages} पृष्ठे • डिजिटल PDF</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-black text-slate-900">
                          {item.isFree ? 'मोफत' : `₹${item.discountedPrice}`}
                        </span>
                        {item.originalPrice > item.discountedPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="हटवा"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    {t.checkout.couponCode}
                  </span>
                  {appliedCoupon ? (
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      काढून टाका
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">वापरा: CHAI10</span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>कूपन &ldquo;{appliedCoupon}&rdquo; लागू झाले! १०% अतिरिक्त सूट.</span>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="उदा. CHAI10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 uppercase tracking-wider focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-2xs cursor-pointer"
                    >
                      {t.checkout.applyCoupon}
                    </button>
                  </form>
                )}

                {couponMsg && !appliedCoupon && (
                  <p className="text-[11px] text-amber-700 font-medium">{couponMsg}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t.checkout.itemTotal}</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{t.checkout.discount}</span>
                    <span>-₹{cartDiscount}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>{t.checkout.finalPayable}</span>
                  <span className="text-base text-slate-900 font-black">₹{cartTotal}</span>
                </div>
              </div>

              {/* Trust Tag */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>सुरक्षित डिजिटल डाउनलोड • कायमस्वरूपी प्रवेश</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
            >
              <span>{t.checkout.proceedToPay}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-slate-400">
              पेमेंटनंतर लगेच तुमच्या डॅशबोर्डवर PDF उपलब्ध होईल.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
