'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle2, XCircle, MinusCircle, Clock, Target, RotateCcw, ArrowLeft, BookOpen, AlertTriangle, Medal } from 'lucide-react';
import { formatClock, type AttemptResult, type LeaderboardEntry, type QuizSummary } from '@/lib/quizTypes';
import type { Language } from '@/lib/types';
import { quizApi } from '@/lib/quizClient';
import { LeaderboardList, tx } from './shared';

interface Props {
  result: AttemptResult;
  quiz: QuizSummary | null;
  lang: Language;
  onRetake: (() => void) | null;
  onBack: () => void;
  onMaterials: () => void;
}

type Filter = 'all' | 'correct' | 'wrong' | 'skipped';

export function QuizResultView({ result, quiz, lang, onRetake, onBack, onMaterials }: Props) {
  const en = lang === 'en';
  const [filter, setFilter] = useState<Filter>('all');
  const [qLang, setQLang] = useState<'mr' | 'en'>(en ? 'en' : 'mr');
  const [board, setBoard] = useState<{ participants: number; top: LeaderboardEntry[]; you: LeaderboardEntry | null } | null>(null);

  useEffect(() => {
    let alive = true;
    quizApi
      .leaderboard(result.quizSlug, 10)
      .then((b) => alive && setBoard(b))
      .catch(() => alive && setBoard({ participants: 0, top: [], you: null }));
    return () => {
      alive = false;
    };
  }, [result.quizSlug]);

  const attempted = result.correct + result.wrong;
  const accuracy = attempted ? Math.round((result.correct / attempted) * 100) : 0;
  const reviewed = result.review.filter((r) => filter === 'all' || r.status === filter);
  const circumference = 2 * Math.PI * 52;
  const pct = Math.max(0, Math.min(100, result.percentage));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Scorecard */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="relative w-36 h-36 mx-auto" role="img" aria-label={`${result.percentage}%`}>
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={result.passed ? '#059669' : '#E11D48'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 font-mono">{result.percentage}%</span>
              <span className="text-[10px] text-slate-500 font-semibold">{en ? `pass ${result.passPercentage}%` : `उत्तीर्ण ${result.passPercentage}%`}</span>
            </div>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {result.passed ? (en ? 'PASSED' : 'उत्तीर्ण') : en ? 'NOT PASSED' : 'अनुत्तीर्ण'}
              </span>
              {result.rank && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" aria-hidden="true" />
                  {en ? 'Rank' : 'क्रमांक'} #{result.rank} / {result.participants}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {result.passed
                ? en
                  ? 'Excellent! Keep up the momentum.'
                  : 'अभिनंदन! उत्कृष्ट कामगिरी!'
                : en
                  ? 'Good effort — review the solutions and try again.'
                  : 'चांगला प्रयत्न! स्पष्टीकरणे वाचून पुन्हा प्रयत्न करा.'}
            </h1>
            {quiz && <p className="text-sm text-slate-500">{tx(quiz.title, lang)}</p>}
            {result.isLate && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 inline-flex items-center gap-2" role="note">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                {en ? 'Submitted after the time limit — not counted on the leaderboard.' : 'वेळ संपल्यानंतर सबमिट — गुणवत्ता यादीत समाविष्ट नाही.'}
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
          {[
            [<Trophy key="i" className="w-4 h-4 text-amber-500" aria-hidden="true" />, en ? 'Score' : 'गुण', `${result.score} / ${result.totalMarks}`],
            [<CheckCircle2 key="i" className="w-4 h-4 text-emerald-600" aria-hidden="true" />, en ? 'Correct' : 'बरोबर', result.correct],
            [<XCircle key="i" className="w-4 h-4 text-rose-600" aria-hidden="true" />, en ? 'Wrong' : 'चूक', result.wrong],
            [<Target key="i" className="w-4 h-4 text-blue-600" aria-hidden="true" />, en ? 'Accuracy' : 'अचूकता', `${accuracy}%`],
            [<Clock key="i" className="w-4 h-4 text-slate-500" aria-hidden="true" />, en ? 'Time' : 'वेळ', formatClock(result.timeTakenSeconds)],
          ].map(([icon, label, value], i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
              <dt className="text-[11px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                {icon}
                {label}
              </dt>
              <dd className="text-lg font-black text-slate-900 font-mono mt-1">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
          {onRetake && (
            <button onClick={onRetake} className="px-5 py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> {en ? 'Retake test' : 'पुन्हा टेस्ट द्या'}
            </button>
          )}
          <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {en ? 'All tests' : 'इतर टेस्ट्स'}
          </button>
          <button onClick={onMaterials} className="px-5 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <BookOpen className="w-4 h-4" aria-hidden="true" /> {en ? 'Related notes' : 'संबंधित नोट्स पाहा'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Review */}
        <section className="lg:col-span-8 space-y-4" aria-labelledby="review-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="review-title" className="text-lg font-bold text-[#1E2653]">{en ? 'Detailed solutions' : 'सविस्तर विश्लेषण व स्पष्टीकरण'}</h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label={en ? 'Language' : 'भाषा'}>
              {(['mr', 'en'] as const).map((l) => (
                <button key={l} onClick={() => setQLang(l)} aria-pressed={qLang === l} className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${qLang === l ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'}`}>
                  {l === 'mr' ? 'मराठी' : 'English'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={en ? 'Filter answers' : 'फिल्टर'}>
            {(
              [
                ['all', en ? 'All' : 'सर्व', result.review.length],
                ['correct', en ? 'Correct' : 'बरोबर', result.correct],
                ['wrong', en ? 'Wrong' : 'चूक', result.wrong],
                ['skipped', en ? 'Skipped' : 'सोडले', result.skipped],
              ] as [Filter, string, number][]
            ).map(([id, label, n]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${filter === id ? 'bg-[#1C2C5B] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                {label} ({n})
              </button>
            ))}
          </div>

          {!result.showSolutions && (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              {en ? 'Correct answers for this test will be shared later.' : 'या टेस्टची अचूक उत्तरे नंतर जाहीर केली जातील.'}
            </p>
          )}

          <ol className="space-y-4">
            {reviewed.map((r) => {
              const number = result.review.indexOf(r) + 1;
              const tone = r.status === 'correct' ? 'border-emerald-200' : r.status === 'wrong' ? 'border-rose-200' : 'border-slate-200';
              return (
                <li key={r.id} className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 ${tone}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Q{number} • {r.topic}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'correct' ? 'bg-emerald-50 text-emerald-700' : r.status === 'wrong' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {r.status === 'correct' ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : r.status === 'wrong' ? <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> : <MinusCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                      {r.status === 'correct' ? (en ? 'Correct' : 'बरोबर') : r.status === 'wrong' ? (en ? 'Wrong' : 'चूक') : en ? 'Skipped' : 'सोडला'} ({r.marksAwarded > 0 ? '+' : ''}
                      {r.marksAwarded})
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-line">{tx(r.question, qLang)}</p>
                  {r.image && <img src={r.image} alt="" className="max-h-64 rounded-xl border border-slate-200 object-contain" />}
                  <ul className="space-y-2">
                    {r.options.map((o) => {
                      const isCorrect = r.correctOption === o.id;
                      const isPicked = r.selected === o.id;
                      return (
                        <li
                          key={o.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                            isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : isPicked ? 'bg-rose-50 border-rose-300 text-rose-900' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono font-bold">{o.id}.</span>
                          <span className="flex-1">{tx(o.text, qLang)}</span>
                          {isPicked && <span className="text-[10px] font-bold uppercase shrink-0">{en ? 'your answer' : 'तुमचे उत्तर'}</span>}
                          {isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" aria-label={en ? 'Correct answer' : 'योग्य उत्तर'} />}
                        </li>
                      );
                    })}
                  </ul>
                  {r.explanation && (
                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                      <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">{en ? 'Explanation' : 'स्पष्टीकरण'}</p>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{tx(r.explanation, qLang)}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <LeaderboardList entries={board?.top ?? []} you={board?.you ?? null} participants={board?.participants ?? 0} lang={lang} loading={!board} />
        </div>
      </div>
    </div>
  );
}
