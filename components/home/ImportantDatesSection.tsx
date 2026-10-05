'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { IMPORTANT_DATES_DATA } from '@/lib/data';
import { Calendar, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ImportantDatesSection() {
  const { lang, t, navigateTo } = useApp();
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  const filteredDates = IMPORTANT_DATES_DATA.filter((item) => {
    if (filter === 'week') return item.status === 'Closing Soon';
    if (filter === 'month') return item.status === 'Closing Soon' || item.status === 'Active';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closing Soon':
        return 'bg-rose-50 text-rose-800 border-rose-200/80 font-medium';
      case 'Active':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
    }
  };

  return (
    <section className="py-10 sm:py-12 md:py-14 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-3 text-left">
          <div>
            <span className="text-[11px] font-medium text-slate-600 tracking-wide uppercase flex items-center gap-1.5 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full inline-flex mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              परीक्षेचे वेळापत्रक
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {t.sections.importantDates}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
              {t.sections.importantDatesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('important-dates')}
            className="h-8.5 px-3.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>संपूर्ण वेळापत्रक पाहा</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 text-xs font-medium interactive-scrollbar">
          {[
            { id: 'all', label: 'सर्व महत्त्वाच्या तारखा' },
            { id: 'week', label: 'या आठवड्यात (Urgent)' },
            { id: 'month', label: 'या महिन्यात (Approaching)' },
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

        {/* Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
          {filteredDates.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 transition-all duration-200 hover:shadow-2xs hover:-translate-y-0.5 flex flex-col justify-between h-full text-left"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {item.exam}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.lastDate}</span>
                  </div>
                  <h4 className="font-medium text-xs sm:text-sm text-slate-900 mt-1 line-clamp-1 min-h-[20px]">
                    {item.event[lang]}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[34px] font-normal">
                    प्रारंभ: {item.startDate} • अंतिम मुदत: {item.lastDate}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-normal truncate max-w-[120px]">{item.category}</span>
                <button
                  onClick={() => navigateTo('important-dates')}
                  className="font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>तपशील</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
