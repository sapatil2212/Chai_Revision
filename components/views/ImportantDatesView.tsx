'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { IMPORTANT_DATES_DATA } from '@/lib/data';
import { Calendar, Clock, AlertTriangle, ArrowRight, CheckCircle2, Search } from 'lucide-react';

export function ImportantDatesView() {
  const { lang, t, navigateTo } = useApp();
  const [filterExam, setFilterExam] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filteredDates = IMPORTANT_DATES_DATA.filter((item) => {
    if (filterExam !== 'All' && item.exam !== filterExam) return false;
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closing Soon':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'Active':
        return 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            परीक्षेचे वेळापत्रक
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.nav.importantDates} — आगामी परीक्षा व मुदत कॅलेंडर
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            हॉल तिकीट, परीक्षा दिनांक, अर्ज करण्याची शेवटची तारीख आणि निकालांच्या महत्त्वाच्या तारखा.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">स्थिती:</span>
            {['All', 'Closing Soon', 'Active', 'Upcoming'].map((u) => (
              <button
                key={u}
                onClick={() => setFilterStatus(u)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  filterStatus === u
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {u === 'All' ? 'सर्व तारखा' : u === 'Closing Soon' ? 'तातडीचे (Closing Soon)' : u === 'Active' ? 'सुरू आहे' : 'आगामी'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">परीक्षा:</span>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
            >
              <option value="All">सर्व परीक्षा</option>
              <option value="MPSC">MPSC</option>
              <option value="संयुक्त गट-ब व क">संयुक्त गट-ब व क</option>
              <option value="तलाठी भरती">तलाठी भरती</option>
              <option value="पोलीस भरती">पोलीस भरती</option>
            </select>
          </div>
        </div>

        {/* Timeline Cards */}
        <div className="space-y-4">
          {filteredDates.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col items-center justify-center text-blue-700 shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-[10px] font-bold mt-0.5">DATE</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {item.exam}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">
                    {item.event[lang]}
                  </h3>

                  <p className="text-xs text-slate-600">
                    वर्ग: {item.category} • प्रारंभ: {item.startDate} • अंतिम मुदत: {item.lastDate}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0 gap-2">
                <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                  {item.lastDate}
                </span>
                <button
                  onClick={() => navigateTo('exam-updates')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>अपडेट पहा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
