'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import {
  CheckCircle2,
  Download,
  ShieldCheck,
  FileText,
  ArrowRight,
  Sparkles,
  Key,
  BookOpen,
} from 'lucide-react';

export function OrderSuccessView() {
  const { orders, viewParams, navigateTo, lang } = useApp();
  const orderId = viewParams.orderId;
  const currentOrder = orders.find((o) => o.id === orderId) || orders[0];

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      alert(`✅ सुरक्षित डाऊनलोड सुरू झाले!\nसामग्री: ${title}\nसुरक्षा टोकन: ${currentOrder?.downloadToken}`);
    }, 1000);
  };

  if (!currentOrder) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">ऑर्डर तपशील सापडला नाही</h2>
        <button
          onClick={() => navigateTo('materials')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          स्टडी मटेरियलकडे जा
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 text-left">
        {/* Success Header Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full inline-block">
            पेमेंट यशस्वी झाले (Payment Successful)
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            अभिनंदन! तुमच्या अभ्यासाची डिजिटल लायब्ररी सक्रिय झाली आहे.
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            ऑर्डर क्रमांक: <strong className="text-slate-900">{currentOrder.id}</strong> • पावती आणि सुरक्षित डाऊनलोड टोकन तुमच्या नोंदणीकृत खात्यात जोडले गेले आहे.
          </p>
        </div>

        {/* Security Download Token Callout */}
        <div className="bg-blue-900 text-white rounded-2xl p-5 border border-blue-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-300" />
              <span className="font-extrabold text-sm">सुरक्षित डिजिटल डाऊनलोड टोकन (Secure Token)</span>
            </div>
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold">ACTIVE</span>
          </div>

          <div className="p-3 bg-blue-950/60 rounded-xl font-mono text-xs text-blue-200 break-all border border-blue-700/50 flex items-center justify-between">
            <span>{currentOrder.downloadToken}</span>
            <span className="text-[10px] text-blue-300/80 font-sans">{currentOrder.tokenExpiresAt}</span>
          </div>

          <p className="text-[11px] text-blue-200/80">
            * हे टोकन केवळ तुमच्या वैयक्तिक उपकरणांवर अधिकृत वाचनासाठी सक्रिय आहे. सुरक्षित एनक्रिप्शनद्वारे पीडीएफ डाउनलोड सुरक्षित केले आहे.
          </p>
        </div>

        {/* Purchased Items & Direct Downloads */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 pb-2 border-b border-slate-100">
            तुमचे खरेदी केलेले स्टडी मटेरियल ({currentOrder.items.length})
          </h3>

          <div className="space-y-3">
            {currentOrder.items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.coverImage}
                    alt={item.title[lang]}
                    className="w-12 h-16 object-cover rounded-lg shadow-2xs shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{item.exam}</span>
                    <h4 className="font-bold text-sm text-slate-900 truncate">{item.title[lang]}</h4>
                    <p className="text-xs text-slate-500">{item.pages} पृष्ठे • सर्चबल डिजिटल PDF</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(item.id, item.title.mr)}
                  disabled={downloadingId === item.id}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 shadow-xs active:scale-98 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{downloadingId === item.id ? 'डाउनलोड होत आहे...' : 'PDF डाऊनलोड करा'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span>माझ्या डिजिटल लायब्ररीकडे जा (My Dashboard)</span>
          </button>
          <button
            onClick={() => navigateTo('materials')}
            className="py-3 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            इतर साहित्य ब्राउझ करा
          </button>
        </div>
      </div>
    </div>
  );
}
