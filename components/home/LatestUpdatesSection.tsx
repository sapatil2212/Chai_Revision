'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Bell, Calendar, ArrowRight, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export function LatestUpdatesSection() {
  const { lang, t, navigateTo, examUpdates } = useApp();
  const [filter, setFilter] = useState<'all' | 'admit' | 'result' | 'notification'>('all');

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'ADMIT CARD':
        return 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium';
      case 'NEW':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium';
      case 'RESULT':
        return 'bg-blue-50 text-blue-800 border-blue-200/80 font-medium';
      case 'LAST DATE':
        return 'bg-rose-50 text-rose-800 border-rose-200/80 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
    }
  };

  const filteredUpdates = examUpdates.filter((u) => {
    if (filter === 'admit') return u.badge === 'ADMIT CARD';
    if (filter === 'result') return u.badge === 'RESULT';
    if (filter === 'notification') return u.badge === 'NEW' || u.badge === 'LAST DATE';
    return true;
  });

  return (
    <section className="py-10 sm:py-12 md:py-14 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-3 text-left">
          <div>
            <span className="text-[11px] font-medium text-slate-600 tracking-wide uppercase flex items-center gap-1.5 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full inline-flex mb-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              ताजी अधिकृत माहिती
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {t.sections.latestUpdates}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
              {t.sections.latestUpdatesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('exam-updates')}
            className="h-8.5 px-3.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>सर्व {examUpdates.length} अपडेट्स पाहा</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 text-xs font-medium interactive-scrollbar">
          {[
            { id: 'all', label: 'सर्व अपडेट्स' },
            { id: 'admit', label: 'प्रवेशपत्र (Admit Card)' },
            { id: 'result', label: 'निकाल (Results)' },
            { id: 'notification', label: 'जाहिरात व अंतिम मुदत' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap text-xs ${
                filter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-medium'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredUpdates.slice(0, 6).map((update) => (
            <div
              key={update.id}
              onClick={() => navigateTo('exam-updates')}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-2xs hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group text-left relative"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getBadgeColor(
                      update.badge
                    )}`}
                  >
                    {update.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {update.publishedDate}
                  </span>
                </div>

                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {update.exam}
                </span>

                <h3 className="font-medium text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-2 leading-snug">
                  {update.title[lang]}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                  {update.shortSummary[lang]}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-normal">{update.category}</span>
                <span className="font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                  <span>वाचा</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
