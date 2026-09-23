'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { EXAM_UPDATES_DATA } from '@/lib/data';
import { Bell, Calendar, ArrowRight, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export function LatestUpdatesSection() {
  const { lang, t, navigateTo } = useApp();
  const [filter, setFilter] = useState<'all' | 'admit' | 'result' | 'notification'>('all');

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'ADMIT CARD':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'NEW':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'RESULT':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'LAST DATE':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredUpdates = EXAM_UPDATES_DATA.filter((u) => {
    if (filter === 'admit') return u.badge === 'ADMIT CARD';
    if (filter === 'result') return u.badge === 'RESULT';
    if (filter === 'notification') return u.badge === 'NEW' || u.badge === 'LAST DATE';
    return true;
  });

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-flex mb-2">
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              ताजी अधिकृत माहिती
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.latestUpdates}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.latestUpdatesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('exam-updates')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>सर्व {EXAM_UPDATES_DATA.length} अपडेट्स पाहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 text-xs font-semibold interactive-scrollbar">
          {[
            { id: 'all', label: 'सर्व अपडेट्स' },
            { id: 'admit', label: 'प्रवेशपत्र (Admit Card)' },
            { id: 'result', label: 'निकाल (Results)' },
            { id: 'notification', label: 'जाहिरात व अंतिम मुदत' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap text-xs ${
                filter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUpdates.slice(0, 6).map((update) => (
            <div
              key={update.id}
              onClick={() => navigateTo('exam-updates')}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-5 transition-all duration-300 hover:shadow-[0_10px_25px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group text-left relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getBadgeColor(
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

                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                  {update.exam}
                </span>

                <h3 className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-700 transition-colors mt-1 line-clamp-2 leading-snug">
                  {update.title[lang]}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                  {update.shortSummary[lang]}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-normal">{update.category}</span>
                <span className="font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
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
