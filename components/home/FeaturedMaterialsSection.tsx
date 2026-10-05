'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { ExamCategory } from '@/lib/types';

export function FeaturedMaterialsSection() {
  const { lang, t, navigateTo, materials } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filterTabs = [
    { id: 'All', label: 'सर्व साहित्य (All)' },
    { id: 'MPSC', label: 'MPSC राज्यसेवा' },
    { id: 'PSI', label: 'PSI / STI संयुक्त' },
    { id: 'Talathi', label: 'तलाठी भरती (TCS)' },
    { id: 'Police Bharti', label: 'पोलीस भरती' },
  ];

  // Admin-featured items first; otherwise keep the admin's display order (stable sort)
  const displayedProducts = materials
    .filter((p) => {
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'PSI') return p.exam === 'PSI' || p.exam === 'STI' || p.exam === 'ASO';
      return p.exam === selectedFilter;
    })
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

  return (
    <section className="py-10 sm:py-12 md:py-14 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-3 text-left">
          <div>
            <span className="text-[11px] font-medium text-slate-600 tracking-wide uppercase flex items-center gap-1.5 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full inline-flex mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              डिजिटल स्टडी मटेरियल्स
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {t.sections.popularMaterials}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
              {t.sections.popularMaterialsSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('materials')}
            className="h-8.5 px-3.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>{t.sections.viewAll} ({materials.length})</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 text-xs font-medium interactive-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-medium'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {displayedProducts.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 py-8">
              या परीक्षेसाठी साहित्य लवकरच उपलब्ध होईल.
            </p>
          )}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs text-left">
          <div>
            <h4 className="font-medium text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>तुमच्या परीक्षेच्या विशिष्ट विषयाचे नोट्स शोधत आहात?</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl font-normal">
              इतिहास, भूगोल, राज्यघटना, गणित, विज्ञान आणि TCS/IBPS पॅटर्ननुसार विषयवार फिल्टर करा.
            </p>
          </div>
          <button
            onClick={() => navigateTo('materials')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all shrink-0 shadow-xs cursor-pointer active:scale-98"
          >
            स्टडी मटेरियल मार्केटप्लेस उघडा
          </button>
        </div>
      </div>
    </section>
  );
}
