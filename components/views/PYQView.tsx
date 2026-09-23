'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { PYQS_DATA } from '@/lib/data';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Bookmark,
  Share2,
  Sparkles,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export function PYQView() {
  const { lang, t, navigateTo, toggleBookmark, isBookmarked } = useApp();

  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Track answers state: { [questionId]: selectedOptionIndex }
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  // Track explanation toggle per question: { [questionId]: boolean }
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  const exams = ['All', 'MPSC', 'PSI', 'Talathi', 'Police Bharti'];
  const years = ['All', '2025', '2024', '2023', '2022'];
  const subjects = ['All', 'इतिहास', 'राज्यघटना', 'भूगोल', 'मराठी व्याकरण', 'सामान्य ज्ञान'];

  const filteredPYQs = PYQS_DATA.filter((item) => {
    if (selectedExam !== 'All' && item.exam !== selectedExam) return false;
    if (selectedYear !== 'All' && String(item.year) !== selectedYear) return false;
    if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
    return true;
  });

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setRevealedExplanations((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setRevealedExplanations({});
  };

  const totalAnswered = Object.keys(userAnswers).length;
  const totalCorrect = Object.entries(userAnswers).filter(
    ([id, ansIdx]) => {
      const q = PYQS_DATA.find((p) => p.id === id);
      return q && q.correctOption === ansIdx;
    }
  ).length;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              परीक्षेचे मागील प्रश्न
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t.nav.pyq} — प्रश्नसंच व सराव
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              MPSC, संयुक्त आणि सरळसेवा परीक्षांचे मागील वर्षांचे विश्लेषणात्मक प्रश्न व उत्तरे.
            </p>
          </div>

          {totalAnswered > 0 && (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">तुमचा स्कोअर</span>
                <span className="text-base font-black text-slate-900">
                  {totalCorrect} / {totalAnswered} योग्य
                </span>
              </div>
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Reset Practice"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>सराव फिल्टर:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Exam Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">परीक्षा</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
              >
                {exams.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex === 'All' ? 'सर्व परीक्षा (All Exams)' : ex}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">वर्ष</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr === 'All' ? 'सर्व वर्षे (All Years)' : yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">विषय</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
              >
                {subjects.map((sb) => (
                  <option key={sb} value={sb}>
                    {sb === 'All' ? 'सर्व विषय (All Subjects)' : sb}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-5">
          {filteredPYQs.map((q, qIndex) => {
            const hasAnswered = userAnswers[q.id] !== undefined;
            const chosenOption = userAnswers[q.id];
            const isCorrect = chosenOption === q.correctOption;
            const isShowExp = revealedExplanations[q.id];
            const bookmarked = isBookmarked(q.id);

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 text-left"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                      {q.exam} {q.year}
                    </span>
                    <span className="text-[11px] font-bold text-blue-600">
                      {q.subject} • {q.topic}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleBookmark(q.id)}
                    className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
                  </button>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-400">प्रश्न {qIndex + 1}:</span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    {q.question[lang]}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosenOption === opt.id;
                    const isOptionCorrect = opt.id === q.correctOption;

                    let optClass = 'border-slate-200 hover:bg-slate-50 text-slate-800';
                    if (hasAnswered) {
                      if (isOptionCorrect) {
                        optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                      } else if (isSelected && !isOptionCorrect) {
                        optClass = 'border-red-500 bg-red-50 text-red-900';
                      }
                    } else if (isSelected) {
                      optClass = 'border-blue-500 bg-blue-50 text-blue-900 font-bold';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt.text[lang]}</span>
                        </div>

                        {hasAnswered && isOptionCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isOptionCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Explanation Reveal */}
                {isShowExp && (
                  <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        सविस्तर स्पष्टीकरण व संदर्भ
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        योग्य उत्तर: पर्याय {String.fromCharCode(65 + Math.max(0, q.options.findIndex((o) => o.id === q.correctOption)))}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                      {q.explanation[lang]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA to get Full Subject PYQ Book */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-amber-50/80 text-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-blue-200/80">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              मागील १० वर्षांचे संपूर्ण विश्लेषणात्मक PYQ पुस्तक हवे आहे?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              सर्व विषयांचे ५,०००+ प्रश्न घटकनिहाय मांडणीसह आमच्या डिजिटल स्टडी मटेरियल्स मध्ये उपलब्ध आहेत.
            </p>
          </div>
          <button
            onClick={() => navigateTo('materials', { exam: 'MPSC' })}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shrink-0 transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            PYQ ई-बुक्स पाहा
          </button>
        </div>
      </div>
    </div>
  );
}
