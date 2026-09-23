'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA } from '@/lib/data';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { ExamCategory } from '@/lib/types';

export function FeaturedMaterialsSection() {
  const { lang, t, navigateTo } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filterTabs = [
    { id: 'All', label: 'सर्व साहित्य (All)' },
    { id: 'MPSC', label: 'MPSC राज्यसेवा' },
    { id: 'PSI', label: 'PSI / STI संयुक्त' },
    { id: 'Talathi', label: 'तलाठी भरती (TCS)' },
    { id: 'Police Bharti', label: 'पोलीस भरती' },
  ];

  const displayedProducts = STUDY_MATERIALS_DATA.filter((p) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'PSI') return p.exam === 'PSI' || p.exam === 'STI' || p.exam === 'ASO';
    return p.exam === selectedFilter;
  });

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-flex mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              डिजिटल स्टडी मटेरियल्स
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.popularMaterials}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.popularMaterialsSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('materials')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>{t.sections.viewAll} ({STUDY_MATERIALS_DATA.length}+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 text-xs font-semibold interactive-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayedProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-10 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-amber-50/80 border border-blue-200/70 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-center sm:text-left">
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>तुमच्या परीक्षेच्या विशिष्ट विषयाचे नोट्स शोधत आहात?</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              इतिहास, भूगोल, राज्यघटना, गणित, विज्ञान आणि TCS/IBPS पॅटर्ननुसार विषयवार फिल्टर करा.
            </p>
          </div>
          <button
            onClick={() => navigateTo('materials')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-xs active:scale-98 cursor-pointer"
          >
            स्टडी मटेरियल मार्केटप्लेस उघडा
          </button>
        </div>
      </div>
    </section>
  );
}
