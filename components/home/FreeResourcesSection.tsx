'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA, PYQS_DATA } from '@/lib/data';
import { Sparkles, Download, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export function FreeResourcesSection() {
  const { lang, t, navigateTo, setPreviewProduct, addToCart } = useApp();

  const freeMaterials = STUDY_MATERIALS_DATA.filter((p) => p.isFree);

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Banner Card - Vibrant Light Theme */}
        <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/60 text-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden relative border border-emerald-200/80">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>विद्यार्थी कल्याण उपक्रम • १००% मोफत</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight leading-tight">
                {t.sections.freeResources}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl font-normal">
                {t.sections.freeResourcesSub}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => navigateTo('free-resources')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-xs sm:text-sm transition-all shadow-sm active:scale-98 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>सर्व मोफत साहित्य डाऊनलोड करा</span>
                </button>
                <button
                  onClick={() => navigateTo('pyq')}
                  className="px-4 py-2.5 bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 font-medium rounded-full text-xs sm:text-sm transition-all border border-slate-200 hover:border-slate-300 shadow-2xs cursor-pointer"
                >
                  PYQ प्रश्नसंच सोडवा
                </button>
              </div>
            </div>

            {/* Right Free Cards Stack */}
            <div className="lg:col-span-5 space-y-3">
              {freeMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200/80 hover:border-emerald-200 rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between gap-3 text-left hover:shadow-[0_10px_25px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 flex items-center justify-center shrink-0 font-semibold text-xs">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.2 rounded">
                        {mat.exam} • {mat.pages} पृष्ठे
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {mat.title[lang]}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPreviewProduct(mat);
                    }}
                    className="p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold shrink-0 transition-all shadow-2xs cursor-pointer"
                    title="पाहा व डाउनलोड करा"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
