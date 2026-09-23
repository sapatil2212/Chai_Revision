'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { CURRENT_AFFAIRS_DATA } from '@/lib/data';
import {
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

export function CurrentAffairsSection() {
  const { lang, t, navigateTo } = useApp();
  const [selectedNewsIdx, setSelectedNewsIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentItem = CURRENT_AFFAIRS_DATA[selectedNewsIdx] || CURRENT_AFFAIRS_DATA[0];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleNewsChange = (idx: number) => {
    setSelectedNewsIdx(idx);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const handleOptionClick = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
  };

  const handleCopyPoints = () => {
    const textToCopy = `${currentItem.title[lang]}\n\nठळक मुद्दे:\n` +
      currentItem.points[lang].map((p, i) => `${i + 1}. ${p}`).join('\n');
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-amber-800 tracking-wider uppercase flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/70 px-3 py-0.5 rounded-full inline-flex mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              दैनिक चालू घडामोडी
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.currentAffairsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.currentAffairsSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('current-affairs')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>चालू घडामोडी संग्रह पाहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Topic Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 interactive-scrollbar">
          <span className="text-xs font-medium text-slate-400 shrink-0 mr-1">आजचे विषय:</span>
          {CURRENT_AFFAIRS_DATA.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => handleNewsChange(idx)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                selectedNewsIdx === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedNewsIdx === idx ? 'bg-amber-300 animate-pulse' : 'bg-slate-300'}`} />
              <span className="truncate max-w-[200px]">{item.title[lang]}</span>
            </button>
          ))}
        </div>

        {/* 2 Column Layout: Today's Highlights (Left) + Interactive Daily MCQ (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Highlights Box (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.04)] flex flex-col justify-between h-full text-left">
            <div className="space-y-4">
              {/* Category & Date Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {currentItem.category}
                  </span>
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                    महाराष्ट्र विशेष
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentItem.date}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 leading-snug">
                {currentItem.title[lang]}
              </h3>

              {/* Bullet Points */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                    ठळक परीक्षा मुद्दे (High Yield Points):
                  </span>
                  <button
                    onClick={handleCopyPoints}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 transition-colors cursor-pointer shadow-2xs"
                    title="मुद्दे कॉपी करा"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">कॉपी झाले</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>कॉपी करा</span>
                      </>
                    )}
                  </button>
                </div>

                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  {currentItem.points[lang].map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">स्रोत: पीआयबी (PIB) व महाराष्ट्र शासन अधिकृत</span>
              <button
                onClick={() => navigateTo('current-affairs')}
                className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>संपूर्ण विश्लेषण वाचा</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Interactive Daily Quiz / MCQ (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.04)] flex flex-col justify-between h-full text-left">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-slate-800">
                    {t.sections.dailyQuiz}
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-blue-50 border border-blue-200/70 text-blue-700 px-2.5 py-0.5 rounded-full">
                  MPSC प्रॅक्टिस
                </span>
              </div>

              {/* Question Text */}
              {currentItem.mcqQuestion && (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed mb-4">
                    {currentItem.mcqQuestion.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentItem.mcqQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentItem.mcqQuestion!.answerIndex;

                      let optClass = 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-800 bg-white';
                      if (showExplanation) {
                        if (isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isSelected) {
                          optClass = 'border-red-400 bg-red-50 text-red-900 font-medium';
                        } else {
                          optClass = 'border-slate-200 opacity-60 text-slate-600 bg-slate-50';
                        }
                      } else if (isSelected) {
                        optClass = 'border-blue-600 bg-blue-50 text-blue-900 font-bold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(idx)}
                          disabled={showExplanation}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer shadow-2xs ${optClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {showExplanation && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {showExplanation && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Reveal */}
                  {showExplanation && (
                    <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                      <p className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>अचूक उत्तर व स्पष्टीकरण:</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        {currentItem.mcqQuestion.explanation}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Question Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">योग्य पर्याय निवडून त्वरित उत्तर तपासा.</span>
              <button
                onClick={() => {
                  setSelectedOption(null);
                  setShowExplanation(false);
                  setSelectedNewsIdx((prev) => (prev + 1) % CURRENT_AFFAIRS_DATA.length);
                }}
                className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>पुढील प्रश्न</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
