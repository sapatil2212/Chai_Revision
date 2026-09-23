'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA, PYQS_DATA } from '@/lib/data';
import { Sparkles, Download, CheckCircle2, ShieldCheck, Eye, FileText, ArrowRight } from 'lucide-react';

export function FreeResourcesView() {
  const { lang, t, setPreviewProduct, navigateTo } = useApp();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const freeItems = STUDY_MATERIALS_DATA.filter((m) => m.isFree);

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    // Simulate secure token generation and direct download
    setTimeout(() => {
      setDownloadingId(null);
      setDownloadSuccessId(id);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    }, 1200);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3" />
            १००% मोफत अभ्यास साहित्य
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            {t.nav.freeResources} — मोफत डिजिटल लायब्ररी
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            विद्यार्थ्यांसाठी विनामूल्य उपलब्ध अधिकृत अभ्यासक्रम, नमुना नोट्स आणि PYQ पेपर्स.
          </p>
        </div>

        {/* Free Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {freeItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left hover:border-blue-400 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-xs">
                    FREE PDF
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {item.pages} पृष्ठे • {item.language}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <img
                    src={item.coverImage}
                    alt={item.title[lang]}
                    className="w-16 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase">{item.exam}</span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                      {item.title[lang]}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.description[lang]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewProduct(item)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>नमुना पाहा</span>
                </button>

                <button
                  onClick={() => handleDownload(item.id, item.title.mr)}
                  disabled={downloadingId === item.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shadow-blue-500/20"
                >
                  {downloadingId === item.id ? (
                    <span>टोकन तयार होत आहे...</span>
                  ) : downloadSuccessId === item.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>डाऊनलोड सुरू झाले!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>मोफत डाऊनलोड करा</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Additional Free Resource: Official Syllabus Copy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left hover:border-blue-400 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-xs">
                  SYLLABUS
                </span>
                <span className="text-xs text-slate-500 font-semibold">अधिकृत कॉपी</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-mono font-bold text-xs">
                  MPSC
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase">MPSC २०२६</span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                    राज्यसेवा पूर्व व मुख्य परीक्षा सविस्तर मायक्रो सिलॅबस
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    आयोगाने जारी केलेला संपूर्ण मराठी अभ्यासक्रम व गुणविभागणी तक्ता.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">१००% मोफत PDF</span>
              <button
                onClick={() => handleDownload('syl-1', 'Syllabus')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shadow-blue-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>डाऊनलोड करा</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Watermark Notice */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            सर्व मोफत फाइल्स वैयक्तिक अभ्यासासाठी विनामूल्य आहेत. सुरक्षित डाऊनलोड टोकनद्वारे त्वरित सुरक्षित डाउनलोड उपलब्ध होते.
          </span>
        </div>
      </div>
    </div>
  );
}
