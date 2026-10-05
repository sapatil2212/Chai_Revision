'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { pyqApi, type PyqBrowseQuery } from '@/lib/pyqClient';
import type { PyqFilterOptions, PyqQuestion } from '@/lib/pyqTypes';
import { SUBJECT_LABELS_MR } from '@/lib/adminOptions';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Filter,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';

const PAGE_SIZE = 10;

const T = {
  mr: {
    eyebrow: 'परीक्षेचे मागील प्रश्न',
    heading: 'PYQs प्रश्नसंच — सराव',
    sub: 'MPSC, संयुक्त आणि सरळसेवा परीक्षांचे मागील वर्षांचे प्रश्न, उत्तरांसह व सविस्तर स्पष्टीकरणासह.',
    filters: 'सराव फिल्टर:',
    exam: 'परीक्षा',
    year: 'वर्ष',
    subject: 'विषय',
    allExams: 'सर्व परीक्षा',
    allYears: 'सर्व वर्षे',
    allSubjects: 'सर्व विषय',
    searchPh: 'प्रश्न, घटक किंवा पेपर शोधा…',
    score: 'तुमचा स्कोअर',
    correct: 'योग्य',
    reset: 'सराव पुन्हा सुरू करा',
    question: 'प्रश्न',
    answer: 'योग्य उत्तर',
    option: 'पर्याय',
    explanation: 'सविस्तर स्पष्टीकरण व संदर्भ',
    loading: 'प्रश्न लोड होत आहेत…',
    loadMore: 'अधिक प्रश्न पाहा',
    empty: 'या फिल्टरसाठी एकही प्रश्न सापडला नाही.',
    emptyAll: 'अजून मागील वर्षांचे प्रश्न उपलब्ध नाहीत. लवकरच जोडले जातील.',
    clear: 'फिल्टर काढा',
    showing: 'पैकी',
    questionsWord: 'प्रश्न',
    error: 'प्रश्न लोड करताना अडचण आली.',
    retry: 'पुन्हा प्रयत्न करा',
    bookmark: 'बुकमार्क',
    ctaTitle: 'मागील १० वर्षांचे संपूर्ण विश्लेषणात्मक PYQ पुस्तक हवे आहे?',
    ctaSub: 'सर्व विषयांचे प्रश्न घटकनिहाय मांडणीसह आमच्या डिजिटल स्टडी मटेरियल्समध्ये उपलब्ध आहेत.',
    ctaBtn: 'PYQ ई-बुक्स पाहा',
  },
  en: {
    eyebrow: 'Previous year questions',
    heading: 'PYQ Question Bank — Practice',
    sub: 'Real questions from past MPSC, Combined and Saral Seva papers, with answers and detailed explanations.',
    filters: 'Practice filters:',
    exam: 'Exam',
    year: 'Year',
    subject: 'Subject',
    allExams: 'All exams',
    allYears: 'All years',
    allSubjects: 'All subjects',
    searchPh: 'Search questions, topics or papers…',
    score: 'Your score',
    correct: 'correct',
    reset: 'Restart practice',
    question: 'Question',
    answer: 'Correct answer',
    option: 'Option',
    explanation: 'Detailed explanation',
    loading: 'Loading questions…',
    loadMore: 'Load more questions',
    empty: 'No question matches these filters.',
    emptyAll: 'No previous-year questions are available yet. They are coming soon.',
    clear: 'Clear filters',
    showing: 'of',
    questionsWord: 'questions',
    error: 'Could not load the questions.',
    retry: 'Try again',
    bookmark: 'Bookmark',
    ctaTitle: 'Want the full 10-year analytical PYQ book?',
    ctaSub: 'Every subject, arranged chapter-wise, in our digital study materials.',
    ctaBtn: 'Browse PYQ e-books',
  },
};

/** Marathi label for a stored subject value, falling back to the raw value. */
const subjectLabel = (subject: string, mr: boolean) => (mr ? SUBJECT_LABELS_MR[subject] || subject : subject);

/**
 * Previous-year question practice. Questions come from the database via /api/pyqs;
 * answers and explanations are revealed as soon as the student picks an option.
 */
export function PYQView() {
  const { lang, navigateTo, toggleBookmark, isBookmarked } = useApp();
  const t = T[lang === 'en' ? 'en' : 'mr'];
  const mr = lang !== 'en';

  const [exam, setExam] = useState('All');
  const [year, setYear] = useState('All');
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // debounced

  const [filters, setFilters] = useState<PyqFilterOptions | null>(null);
  /**
   * The outcome of one exact query. `loading`, `items`, `total` and `error` are all
   * derived from whether this matches the current filters, so the fetch effect never
   * has to set state synchronously.
   */
  const [loaded, setLoaded] = useState<{ key: string; items: PyqQuestion[]; total: number; error: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // bumped by "try again"

  // Practice state is per-session and lives only in the browser
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Filter choices come from the questions that actually exist
  useEffect(() => {
    let alive = true;
    pyqApi
      .filters()
      .then((f) => alive && setFilters(f))
      .catch(() => alive && setFilters({ exams: [], years: [], subjects: [], topics: [], sources: [], total: 0 }));
    return () => {
      alive = false;
    };
  }, []);

  // Typing shouldn't hit the API on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  const baseQuery: PyqBrowseQuery = useMemo(
    () => ({ exam, year: year === 'All' ? undefined : year, subject, search, limit: PAGE_SIZE }),
    [exam, year, subject, search]
  );

  const queryKey = `${JSON.stringify(baseQuery)}|${reloadKey}`;
  const current = loaded?.key === queryKey ? loaded : null;
  const loading = !current;
  const items = current?.items ?? [];
  const total = current?.total ?? 0;
  const error = current?.error ?? '';

  // Changing a filter replaces the list; "load more" appends to it
  useEffect(() => {
    let alive = true;
    pyqApi
      .list({ ...baseQuery, offset: 0 })
      .then((page) => alive && setLoaded({ key: queryKey, items: page.items, total: page.total, error: '' }))
      .catch((err) => alive && setLoaded({ key: queryKey, items: [], total: 0, error: (err as Error).message }));
    return () => {
      alive = false;
    };
  }, [baseQuery, queryKey]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setMoreError('');
    pyqApi
      .list({ ...baseQuery, offset: items.length })
      .then((page) =>
        setLoaded((prev) => {
          if (!prev || prev.key !== queryKey) return prev; // filters changed mid-request
          // Guard against duplicates if the bank changed between requests
          const seen = new Set(prev.items.map((p) => p.id));
          return { ...prev, items: [...prev.items, ...page.items.filter((p) => !seen.has(p.id))], total: page.total };
        })
      )
      .catch((err) => setMoreError((err as Error).message))
      .finally(() => setLoadingMore(false));
  }, [baseQuery, items.length, queryKey]);

  const answeredIds = Object.keys(answers);
  const correctCount = answeredIds.filter((id) => {
    const q = items.find((x) => x.id === id);
    return q && answers[id] === q.correctOption;
  }).length;

  const hasFilter = exam !== 'All' || year !== 'All' || subject !== 'All' || !!search;
  const clearFilters = () => {
    setExam('All');
    setYear('All');
    setSubject('All');
    setQuery('');
  };

  const selectCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600';

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {t.eyebrow}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{t.heading}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.sub}</p>
          </div>

          {answeredIds.length > 0 && (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs shrink-0">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.score}</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {correctCount} / {answeredIds.length} {t.correct}
                </span>
              </div>
              <button
                onClick={() => setAnswers({})}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title={t.reset}
                aria-label={t.reset}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Filter className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>{t.filters}</span>
            </div>
            {hasFilter && (
              <button onClick={clearFilters} className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                {t.clear}
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPh}
              aria-label={t.searchPh}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="pyq-f-exam" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                {t.exam}
              </label>
              <select id="pyq-f-exam" value={exam} onChange={(e) => setExam(e.target.value)} className={selectCls}>
                <option value="All">{t.allExams}</option>
                {(filters?.exams ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pyq-f-year" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                {t.year}
              </label>
              <select id="pyq-f-year" value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
                <option value="All">{t.allYears}</option>
                {(filters?.years ?? []).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pyq-f-subject" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                {t.subject}
              </label>
              <select id="pyq-f-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={selectCls}>
                <option value="All">{t.allSubjects}</option>
                {(filters?.subjects ?? []).map((o) => (
                  <option key={o} value={o}>
                    {subjectLabel(o, mr)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!loading && total > 0 && (
            <p className="text-[11px] text-slate-500 font-mono">
              {items.length} {t.showing} {total} {t.questionsWord}
            </p>
          )}
        </div>

        {/* Error */}
        {(error || moreError) && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" role="alert">
            <p className="text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {t.error} {error || moreError}
            </p>
            <button
              onClick={() => {
                setMoreError('');
                setReloadKey((k) => k + 1);
              }}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-sm text-slate-500 flex items-center justify-center gap-2" role="status" aria-live="polite">
            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.loading}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center space-y-3">
            <HelpCircle className="w-7 h-7 mx-auto text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">{hasFilter ? t.empty : t.emptyAll}</p>
            {hasFilter && (
              <button onClick={clearFilters} className="px-5 py-2.5 bg-[#1C2C5B] text-white rounded-xl text-xs font-bold cursor-pointer">
                {t.clear}
              </button>
            )}
          </div>
        )}

        {/* Questions */}
        {!loading && items.length > 0 && (
          <div className="space-y-5">
            {items.map((q, qIndex) => {
              const chosen = answers[q.id];
              const answered = chosen !== undefined;
              const bookmarked = isBookmarked(q.id);
              const correctIndex = q.options.findIndex((o) => o.id === q.correctOption);

              return (
                <article key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 text-left">
                  {/* Meta */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                          {q.exam} {q.year}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {subjectLabel(q.subject, mr)}
                          {q.topic && q.topic !== q.subject ? ` • ${q.topic}` : ''}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">{q.difficulty}</span>
                      </div>
                      {q.source && <p className="text-[10px] text-slate-400 mt-1 truncate">{q.source}</p>}
                    </div>

                    <button
                      onClick={() => toggleBookmark(q.id)}
                      className="text-slate-400 hover:text-blue-600 p-1 transition-colors cursor-pointer shrink-0"
                      title={t.bookmark}
                      aria-label={t.bookmark}
                      aria-pressed={bookmarked}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </button>
                  </div>

                  {/* Question */}
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {t.question} {q.questionNumber ?? qIndex + 1}:
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">{q.question[lang] || q.question.en}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === opt.id;
                      const isCorrect = opt.id === q.correctOption;

                      let cls = 'border-slate-200 hover:bg-slate-50 text-slate-800';
                      if (answered) {
                        if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                        else if (isSelected) cls = 'border-rose-500 bg-rose-50 text-rose-900';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers((prev) => (prev[q.id] !== undefined ? prev : { ...prev, [q.id]: opt.id }))}
                          disabled={answered}
                          aria-pressed={isSelected}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${cls} ${
                            answered ? 'cursor-default' : 'cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700 font-mono">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.text[lang] || opt.text.en}</span>
                          </span>

                          {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />}
                          {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation, revealed after answering */}
                  {answered && (
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-2 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-xs text-blue-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                          {t.explanation}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-[11px]">
                          {t.answer}: {t.option} {String.fromCharCode(65 + Math.max(0, correctIndex))}
                        </span>
                      </div>
                      {(q.explanation[lang] || q.explanation.en) && (
                        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{q.explanation[lang] || q.explanation.en}</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {items.length < total && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loadingMore && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {t.loadMore} ({total - items.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA to the PYQ books */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-amber-50/80 text-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-blue-200/80">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">{t.ctaTitle}</h3>
            <p className="text-xs text-slate-600 mt-1">{t.ctaSub}</p>
          </div>
          <button
            onClick={() => navigateTo('materials', { exam: 'MPSC' })}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shrink-0 transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            {t.ctaBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
