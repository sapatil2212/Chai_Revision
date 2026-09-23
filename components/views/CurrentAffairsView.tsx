'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { CURRENT_AFFAIRS_DATA } from '@/lib/data';
import { Flame, Calendar, BookOpen, Download, Share2, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

export function CurrentAffairsView() {
  const { lang, t, navigateTo, setPreviewProduct } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'महाराष्ट्र विशेष', 'राष्ट्रीय', 'आर्थिक', 'पर्यावरण'];

  const filteredItems = CURRENT_AFFAIRS_DATA.filter(
    (item) => activeCategory === 'All' || item.category === activeCategory
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            दैनिक चालू घडामोडी
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.nav.currentAffairs} — परीक्षा-अभिमुख चालू घडामोडी
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            MPSC राज्यसेवा, गट-ब, क आणि पोलीस भरतीसाठी रोजचे महत्त्वाचे मुद्दे व सराव प्रश्न.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                activeCategory === c
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'All' ? 'सर्व चालू घडामोडी' : c}
            </button>
          ))}
        </div>

        {/* Current Affairs Items */}
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-md uppercase shadow-xs">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {item.date}
                  </span>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {item.title[lang]}
              </h2>

              {/* Key points list */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                  महत्त्वाचे मुद्दे (Key Exam Points):
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {item.points[lang].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related MCQ Question Box */}
              {item.mcqQuestion && (
                <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>संभाव्य परीक्षा प्रश्न:</span>
                  </div>
                  <p className="font-semibold text-slate-900">{item.mcqQuestion.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {item.mcqQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                          i === item.mcqQuestion!.answerIndex
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-mono font-bold text-slate-400">{String.fromCharCode(65 + i)})</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    <strong className="text-slate-700">स्पष्टीकरण:</strong> {item.mcqQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Monthly PDF Bundle Promo */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm shadow-blue-600/10">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">
              मासिक चालू घडामोडी २०२६ ई-बुक हवे आहे?
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              महिन्याभरातील ३००+ वन-लाइनर्स, आकडेवारी आणि टेबल फॉर्मेट मधील नोट्स.
            </p>
          </div>
          <button
            onClick={() => navigateTo('materials', { exam: 'MPSC' })}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl transition-colors shrink-0 shadow-xs"
          >
            चालू घडामोडी ई-बुक पाहा
          </button>
        </div>
      </div>
    </div>
  );
}
