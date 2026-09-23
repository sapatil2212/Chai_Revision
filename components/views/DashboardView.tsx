'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import {
  User,
  BookOpen,
  Download,
  Bookmark,
  Receipt,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Lock,
} from 'lucide-react';

export function DashboardView() {
  const {
    user,
    purchasedProducts,
    orders,
    bookmarks,
    lang,
    t,
    navigateTo,
    setPreviewProduct,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'materials' | 'orders' | 'bookmarks' | 'profile'>('materials');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      alert(`✅ डिजिटल पीडीएफ डाऊनलोड सुरू झाले!\n${title}\nटोकन: ${orders[0]?.downloadToken || 'ACTIVE'}`);
    }, 1000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 text-left">
        {/* User Profile Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-600 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name}</h1>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-xs">ASPIRANT</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email} • {user?.mobile}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold text-blue-600">लक्ष्यित परीक्षा:</span>
                {user?.targetExams.map((ex) => (
                  <span key={ex} className="text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-semibold text-blue-800">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateTo('materials')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs shadow-blue-500/20"
          >
            अधिक साहित्य शोधा
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>माझे स्टडी मटेरियल्स ({purchasedProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>ऑर्डर्स व पावत्या ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>जतन केलेले (Bookmarks)</span>
          </button>
        </div>

        {/* Tab 1: Purchased Materials */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchasedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.coverImage}
                      alt={item.title[lang]}
                      className="w-16 h-20 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{item.exam}</span>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                        {item.title[lang]}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{item.pages} पृष्ठे • डिजिटल PDF</p>
                      <span className="inline-block mt-2 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        कायमस्वरूपी सक्रिय प्रवेश
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setPreviewProduct(item)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      ऑनलाईन वाचा (Reader)
                    </button>

                    <button
                      onClick={() => handleDownload(item.id, item.title.mr)}
                      disabled={downloadingId === item.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>{downloadingId === item.id ? 'डाउनलोड होत आहे...' : 'PDF डाऊनलोड करा'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">ऑर्डर आयडी: {ord.id}</span>
                    <span className="text-slate-500 ml-3">• दिनांक: {ord.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100">
                      {ord.status}
                    </span>
                    <span className="font-bold text-slate-900">एकूण: ₹{ord.totalAmount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {ord.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{it.title[lang]}</span>
                      <span className="text-slate-500">{it.isFree ? 'मोफत' : `₹${it.discountedPrice}`}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] font-mono text-slate-700 flex items-center justify-between">
                  <span>सुरक्षा टोकन: <strong className="text-slate-900">{ord.downloadToken}</strong></span>
                  <span className="text-emerald-700 font-sans font-bold">सक्रिय</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center">
            <h3 className="font-bold text-sm text-slate-900">जतन केलेल्या वस्तू ({bookmarks.length})</h3>
            <p className="text-xs text-slate-500 mt-1">
              अभ्यासासाठी नंतर वाचण्यासाठी सेव्ह केलेले प्रश्न आणि नोट्स येथे दिसतात.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigateTo('pyq')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-blue-500/20"
              >
                PYQ प्रश्नसंचामध्ये बुकमार्क पाहा
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
