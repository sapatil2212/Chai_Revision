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
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200 font-medium';
    }
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-flex mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              परीक्षेचे वेळापत्रक
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.importantDates}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.importantDatesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('important-dates')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>संपूर्ण वेळापत्रक पाहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 text-xs font-semibold interactive-scrollbar">
          {[
            { id: 'all', label: 'सर्व महत्त्वाच्या तारखा' },
            { id: 'week', label: 'या आठवड्यात (Urgent)' },
            { id: 'month', label: 'या महिन्यात (Approaching)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {filteredDates.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between h-full text-left"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {item.exam}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-base sm:text-lg font-black text-blue-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{item.lastDate}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 line-clamp-1 min-h-[20px]">
                    {item.event[lang]}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[34px]">
                    प्रारंभ: {item.startDate} • अंतिम मुदत: {item.lastDate}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium truncate max-w-[120px]">{item.category}</span>
                <button
                  onClick={() => navigateTo('important-dates')}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span>तपासा</span>
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
