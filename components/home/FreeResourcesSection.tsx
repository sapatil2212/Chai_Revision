'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { canDownloadFree, materialDownloadUrl } from '@/lib/materialLinks';
import { Sparkles, Download, Eye } from 'lucide-react';

const T = {
  mr: {
    badge: 'विद्यार्थी कल्याण उपक्रम • १००% मोफत',
    downloadAll: 'सर्व मोफत साहित्य डाऊनलोड करा',
    solvePyq: 'PYQ प्रश्नसंच सोडवा',
    pages: 'पृष्ठे',
    preview: 'नमुना पाहा',
    download: 'मोफत डाउनलोड करा',
  },
  en: {
    badge: 'Student welfare initiative • 100% free',
    downloadAll: 'Download all free material',
    solvePyq: 'Practise PYQs',
    pages: 'pages',
    preview: 'Preview sample',
    download: 'Download free',
  },
  hi: {
    badge: 'विद्यार्थी कल्याण पहल • 100% मुफ्त',
    downloadAll: 'सभी मुफ्त सामग्री डाउनलोड करें',
    solvePyq: 'PYQ प्रश्न हल करें',
    pages: 'पृष्ठ',
    preview: 'नमूना देखें',
    download: 'मुफ्त डाउनलोड करें',
  },
};

export function FreeResourcesSection() {
  const { lang, t, navigateTo, setPreviewProduct, materials } = useApp();
  const tx = T[lang] ?? T.mr;

  const freeMaterials = materials.filter((p) => p.isFree).slice(0, 4);

  return (
    <section className="py-10 sm:py-12 md:py-14 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Banner Card - Clean Light LMS Theme */}
        <div className="bg-slate-50/70 text-slate-900 rounded-2xl p-5 sm:p-7 shadow-2xs overflow-hidden relative border border-slate-200/80">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-3.5 text-left">
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/80 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{tx.badge}</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight leading-tight">
                {t.sections.freeResources}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl font-normal">
                {t.sections.freeResourcesSub}
              </p>

              <div className="pt-1 flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigateTo('free-resources')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs sm:text-sm transition-all shadow-2xs active:scale-98 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{tx.downloadAll}</span>
                </button>
                <button
                  onClick={() => navigateTo('pyq')}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium rounded-xl text-xs sm:text-sm transition-all border border-slate-200/80 shadow-2xs cursor-pointer"
                >
                  {tx.solvePyq}
                </button>
              </div>
            </div>

            {/* Right Free Cards Stack */}
            <div className="lg:col-span-5 space-y-2.5">
              {freeMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between gap-3 text-left hover:shadow-2xs hover:-translate-y-0.5 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 font-medium text-xs">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                        {mat.exam} • {mat.pages} {tx.pages}
                      </span>
                      <h4 className="text-xs font-medium text-slate-900 truncate mt-0.5">
                        {mat.title[lang]}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPreviewProduct(mat)}
                      className="p-2 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-2xs cursor-pointer"
                      title={tx.preview}
                      aria-label={`${tx.preview}: ${mat.title[lang]}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canDownloadFree(mat) && (
                      <a
                        href={materialDownloadUrl(mat.slug)}
                        className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-2xs"
                        title={tx.download}
                        aria-label={`${tx.download}: ${mat.title[lang]}`}
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
