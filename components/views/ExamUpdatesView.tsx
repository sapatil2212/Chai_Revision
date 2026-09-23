'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { EXAM_UPDATES_DATA } from '@/lib/data';
import { Bell, Calendar, ExternalLink, ArrowRight, ArrowLeft, Download, ShieldCheck, Share2 } from 'lucide-react';

export function ExamUpdatesView() {
  const { lang, t, viewParams, navigateTo } = useApp();
  const selectedSlug = viewParams.slug;

  const [filterExam, setFilterExam] = useState<string>('All');
  const [filterBadge, setFilterBadge] = useState<string>('All');

  const selectedUpdate = selectedSlug
    ? EXAM_UPDATES_DATA.find((u) => u.slug === selectedSlug)
    : null;

  const filteredUpdates = EXAM_UPDATES_DATA.filter((u) => {
    if (filterExam !== 'All' && u.exam !== filterExam) return false;
    if (filterBadge !== 'All' && u.badge !== filterBadge) return false;
    return true;
  });

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'ADMIT CARD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NEW':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RESULT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'LAST DATE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // If a single update is selected, show detail view
  if (selectedUpdate) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <button
            onClick={() => navigateTo('exam-updates')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>सर्व परीक्षा अपडेट्सकडे परत जा</span>
          </button>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 text-left">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getBadgeColor(selectedUpdate.badge)}`}>
                  {selectedUpdate.badge}
                </span>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {selectedUpdate.exam}
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {selectedUpdate.publishedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {selectedUpdate.title[lang]}
            </h1>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                थोडक्यात माहिती (Summary)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {selectedUpdate.shortSummary[lang]}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                अधिकृत तपशील व परिपत्रक (Official Notification)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {selectedUpdate.fullContent[lang]}
              </p>
            </div>

            {/* Official Circular Reference Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">अधिकृत परिपत्रक व संकेतस्थळ</p>
                <p className="text-[11px] text-slate-500">{selectedUpdate.category}</p>
              </div>
              <a
                href={selectedUpdate.officialLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-xs shadow-blue-500/20 shrink-0"
              >
                <span>अधिकृत संकेतस्थळ उघडा</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick action: Recommend related notes */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">परीक्षेची तयारी जलद करण्यासाठी:</span>
              <button
                onClick={() => navigateTo('materials', { exam: selectedUpdate.exam })}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>{selectedUpdate.exam} रिव्हिजन साहित्य पाहा</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            अधिकृत परीक्षा सूचना
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.nav.examUpdates}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            MPSC, UPSC, पोलीस भरती आणि तलाठी परीक्षांचे अधिकृत परिपत्रके व अंतिम मुदत.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">श्रेणी:</span>
            {['All', 'ADMIT CARD', 'NEW', 'RESULT', 'LAST DATE'].map((b) => (
              <button
                key={b}
                onClick={() => setFilterBadge(b)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  filterBadge === b
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {b === 'All' ? 'सर्व' : b}
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
              <option value="MPSC">MPSC राज्यसेवा</option>
              <option value="संयुक्त गट-ब व क">संयुक्त गट-ब व क</option>
              <option value="पोलीस भरती">महाराष्ट्र पोलीस भरती</option>
              <option value="तलाठी भरती">तलाठी भरती</option>
            </select>
          </div>
        </div>

        {/* Updates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUpdates.map((update) => (
            <div
              key={update.id}
              onClick={() => navigateTo('exam-updates', { slug: update.slug })}
              className="bg-white hover:bg-blue-50/30 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between text-left group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getBadgeColor(update.badge)}`}>
                    {update.badge}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {update.publishedDate}
                  </span>
                </div>

                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {update.exam}
                </span>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-700 mt-1 leading-snug">
                  {update.title[lang]}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {update.shortSummary[lang]}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-500 truncate max-w-[160px]">
                  {update.category}
                </span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <span>सविस्तर वाचा</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
