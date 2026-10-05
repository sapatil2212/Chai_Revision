'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, Sparkles, Search, ArrowRight, Star, PlayCircle, History, RotateCcw, ClipboardList } from 'lucide-react';
import { quizStatus, type QuizSummary } from '@/lib/quizTypes';
import type { Language } from '@/lib/types';
import type { ActiveAttempt, MyAttempt } from '@/lib/quizClient';
import { SUBJECT_LABELS_MR } from '@/lib/adminOptions';
import { StatusChip, fmtWhen, tx } from './shared';

interface Props {
  quizzes: QuizSummary[];
  lang: Language;
  resume: ActiveAttempt | null;
  history: MyAttempt[];
  onOpen: (quiz: QuizSummary) => void;
  onResume: () => void;
  onDiscardResume: () => void;
  onOpenResult: (a: MyAttempt) => void;
}

type StatusTab = 'all' | 'live' | 'upcoming' | 'ended';

export function QuizLobby({ quizzes, lang, resume, history, onOpen, onResume, onDiscardResume, onOpenResult }: Props) {
  const en = lang === 'en';
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState('All');
  const [subject, setSubject] = useState('All');
  const [tab, setTab] = useState<StatusTab>('all');

  // Refresh countdowns every 30 s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const exams = useMemo(() => Array.from(new Set(quizzes.map((q) => q.exam))), [quizzes]);
  const subjects = useMemo(() => Array.from(new Set(quizzes.map((q) => q.subject))), [quizzes]);
  const counts = useMemo(() => {
    const c = { all: quizzes.length, live: 0, upcoming: 0, ended: 0 };
    quizzes.forEach((q) => c[quizStatus(q, now)]++);
    return c;
  }, [quizzes, now]);

  const filtered = useMemo(() => {
    const qq = query.trim().toLowerCase();
    const order: Record<string, number> = { live: 0, upcoming: 1, ended: 2 };
    return quizzes
      .filter((q) => {
        if (tab !== 'all' && quizStatus(q, now) !== tab) return false;
        if (exam !== 'All' && q.exam !== exam) return false;
        if (subject !== 'All' && q.subject !== subject) return false;
        if (qq && ![q.title.mr, q.title.en, q.subject, q.exam, q.badge ?? ''].join(' ').toLowerCase().includes(qq)) return false;
        return true;
      })
      .sort((a, b) => order[quizStatus(a, now)] - order[quizStatus(b, now)] || Number(b.featured) - Number(a.featured));
  }, [quizzes, query, exam, subject, tab, now]);

  const subjectLabel = (s: string) => (en ? s : SUBJECT_LABELS_MR[s] || s);
  const totalQuestions = quizzes.reduce((n, q) => n + q.questionCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1C2C5B] via-[#1E293B] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Maharashtra Competitive Exam Mock Test Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{en ? 'MCQ Practice & Live Tests' : 'MCQ सराव व Live टेस्ट्स'}</h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {en
              ? 'Practise in real exam conditions: strict timer, negative marking, instant analysis and an all-Maharashtra leaderboard.'
              : 'परीक्षेसारख्या वेळेत सराव करा — काउंटडाऊन टाइमर, निगेटिव्ह मार्किंग, त्वरित विश्लेषण आणि राज्यस्तरीय गुणवत्ता यादी.'}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {quizzes.length} {en ? 'tests' : 'टेस्ट्स'} • {totalQuestions} {en ? 'questions' : 'प्रश्न'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
              {counts.live} {en ? 'open now' : 'सध्या उपलब्ध'}
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-300" aria-hidden="true" />
              {en ? 'Marathi & English explanations' : 'मराठी व English स्पष्टीकरण'}
            </span>
          </div>
        </div>
      </div>

      {/* Resume banner */}
      {resume && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="status">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-amber-900">{en ? 'You have a test in progress' : 'तुमची एक टेस्ट अपूर्ण आहे'}</p>
              <p className="text-xs text-amber-800">{tx(resume.title, lang)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onDiscardResume} className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer">
              {en ? 'Dismiss' : 'नंतर'}
            </button>
            <button onClick={onResume} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer">
              {en ? 'Resume test' : 'टेस्ट पुढे सुरू करा'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1E2653]">{en ? 'Available tests' : 'उपलब्ध मॉक टेस्ट्स'}</h2>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl" role="tablist" aria-label={en ? 'Test status' : 'टेस्ट स्थिती'}>
            {(
              [
                ['all', en ? 'All' : 'सर्व'],
                ['live', en ? 'Open' : 'सुरू'],
                ['upcoming', en ? 'Upcoming' : 'आगामी'],
                ['ended', en ? 'Ended' : 'संपलेल्या'],
              ] as [StatusTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${tab === id ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600'}`}
              >
                {label} <span className="font-mono text-[10px] opacity-70">{counts[id]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en ? 'Search tests…' : 'टेस्ट शोधा (उदा. राज्यघटना, भूगोल)…'}
              aria-label={en ? 'Search tests' : 'टेस्ट शोधा'}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {exams.length > 1 && (
            <select aria-label="Exam" value={exam} onChange={(e) => setExam(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <option value="All">{en ? 'All exams' : 'सर्व परीक्षा'}</option>
              {exams.map((x) => <option key={x}>{x}</option>)}
            </select>
          )}
          {subjects.length > 1 && (
            <select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <option value="All">{en ? 'All subjects' : 'सर्व विषय'}</option>
              {subjects.map((x) => <option key={x} value={x}>{subjectLabel(x)}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">
            {quizzes.length ? (en ? 'No tests match these filters' : 'या फिल्टरनुसार टेस्ट उपलब्ध नाही') : en ? 'New tests are coming soon' : 'नवीन टेस्ट्स लवकरच उपलब्ध होतील'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((quiz) => {
            const status = quizStatus(quiz, now);
            return (
              <article
                key={quiz.id}
                className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${quiz.featured ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200/90 hover:border-blue-400'}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider font-mono">
                        {quiz.exam}
                      </span>
                      <StatusChip quiz={quiz} now={now} lang={lang} />
                    </div>
                    {quiz.featured ? (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" aria-label="Featured" />
                    ) : quiz.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">★ {quiz.badge}</span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">{tx(quiz.title, lang)}</h3>
                    {!en && quiz.title.en !== quiz.title.mr && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{quiz.title.en}</p>}
                  </div>
                  {tx(quiz.description, lang) && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{tx(quiz.description, lang)}</p>}

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Time' : 'वेळ'}</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{quiz.durationMinutes} {en ? 'min' : 'मि.'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Questions' : 'प्रश्न'}</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{quiz.questionCount}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Marks' : 'गुण'}</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">{quiz.totalMarks}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>{en ? 'Negative marking' : 'निगेटिव्ह मार्किंग'}</span>
                      <span className={`font-semibold ${quiz.negativeMarking ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {quiz.negativeMarking ? quiz.negativeLabel : en ? 'None' : 'नाही'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{subjectLabel(quiz.subject)} • {quiz.difficulty}</span>
                      <span>{quiz.attemptsCount} {en ? 'attempts' : 'प्रयत्न'}</span>
                    </div>
                    {quiz.startsAt && status === 'upcoming' && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>{en ? 'Opens' : 'सुरू'}</span>
                        <span>{fmtWhen(quiz.startsAt)}</span>
                      </div>
                    )}
                    {quiz.endsAt && status === 'live' && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>{en ? 'Closes' : 'शेवटची वेळ'}</span>
                        <span>{fmtWhen(quiz.endsAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-5">
                  <button
                    onClick={() => onOpen(quiz)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      status === 'live'
                        ? 'bg-[#1C2C5B] group-hover:bg-blue-700 text-white shadow-md shadow-blue-900/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'live' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                        {en ? 'Start test' : 'टेस्ट सुरू करा'}
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    ) : status === 'upcoming' ? (
                      en ? 'View details' : 'तपशील पाहा'
                    ) : en ? (
                      'View leaderboard'
                    ) : (
                      'गुणवत्ता यादी पाहा'
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* My attempts */}
      {history.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs" aria-labelledby="my-attempts-title">
          <h2 id="my-attempts-title" className="text-sm font-bold text-[#1E2653] flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-blue-600" aria-hidden="true" />
            {en ? 'My recent attempts' : 'माझे अलीकडील प्रयत्न'}
          </h2>
          <ul className="divide-y divide-slate-100">
            {history.slice(0, 8).map((a) => (
              <li key={a.attemptId} className="py-2.5 flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${a.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} aria-hidden="true" />
                <span className="flex-1 min-w-0 truncate font-semibold text-slate-800">{tx(a.title, lang)}</span>
                <span className="font-mono text-slate-600">
                  {a.score}/{a.totalMarks} ({a.percentage}%)
                </span>
                <span className="text-slate-400 hidden sm:inline">{a.completedAt ? fmtWhen(a.completedAt) : ''}</span>
                <button onClick={() => onOpenResult(a)} className="text-blue-700 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  {en ? 'Review' : 'विश्लेषण'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
