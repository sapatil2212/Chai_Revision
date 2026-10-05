'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Flag, RefreshCw, CloudOff, Cloud, AlertTriangle } from 'lucide-react';
import { formatClock, type AttemptResult, type AttemptSession, type OptionId } from '@/lib/quizTypes';
import type { Language } from '@/lib/types';
import { quizApi, quizStorage } from '@/lib/quizClient';
import { tx } from './shared';

interface Props {
  session: AttemptSession;
  lang: Language;
  onSubmitted: (result: AttemptResult) => void;
  onExit: () => void; // leave without submitting (attempt stays resumable)
}

type Answers = Record<string, OptionId | null>;
type SaveState = 'saved' | 'saving' | 'offline';

const KEY_TO_OPTION: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };

export function QuizRunner({ session, lang, onSubmitted, onExit }: Props) {
  const en = lang === 'en';
  const questions = session.questions;
  const total = questions.length;

  // Server clock offset so the countdown matches the server even if the device clock is wrong
  const [offset] = useState(() => new Date(session.serverNow).getTime() - Date.now());
  const deadline = useMemo(() => new Date(session.expiresAt).getTime(), [session.expiresAt]);
  const [now, setNow] = useState(() => Date.now() + offset);

  const [answers, setAnswers] = useState<Answers>(() => ({ ...session.answers, ...quizStorage.getAnswers(session.attemptId) }));
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>(() => ({ [questions[0]?.id]: true }));
  const [index, setIndex] = useState(0);
  const [qLang, setQLang] = useState<'mr' | 'en'>(en ? 'en' : 'mr');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');

  const answersRef = useRef(answers);
  const dirtyRef = useRef(false);
  const submittedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remainingSec = Math.max(0, Math.ceil((deadline - now) / 1000));
  const current = questions[index];

  // ---------------- saving ----------------
  const flushSave = useCallback(async () => {
    if (!dirtyRef.current || submittedRef.current) return;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      await quizApi.save(session.attemptId, session.token, answersRef.current);
      setSaveState('saved');
    } catch {
      dirtyRef.current = true; // retry on next tick
      setSaveState('offline');
    }
  }, [session.attemptId, session.token]);

  const updateAnswers = useCallback(
    (next: Answers) => {
      answersRef.current = next;
      setAnswers(next);
      quizStorage.setAnswers(session.attemptId, next); // instant local backup
      dirtyRef.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flushSave(), 1500); // debounced server autosave
    },
    [session.attemptId, flushSave]
  );

  // ---------------- submit ----------------
  const submit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setSubmitError('');
      try {
        const result = await quizApi.submit(session.attemptId, session.token, answersRef.current);
        quizStorage.clearActive();
        onSubmitted(result);
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        setShowSubmit(true);
        setSubmitError(
          `${auto ? (en ? 'Time is up. ' : 'वेळ संपली. ') : ''}${(err as Error).message}. ${en ? 'Your answers are saved — try again.' : 'तुमची उत्तरे सुरक्षित आहेत — पुन्हा प्रयत्न करा.'}`
        );
      }
    },
    [session.attemptId, session.token, onSubmitted, en]
  );

  // ---------------- timer: tick, autosave retry, auto-submit ----------------
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now() + offset;
      setNow(n);
      if (n >= deadline) void submit(true);
    }, 1000);
    const s = setInterval(() => void flushSave(), 20_000);
    return () => {
      clearInterval(t);
      clearInterval(s);
    };
  }, [offset, deadline, submit, flushSave]);

  // Warn before leaving mid-test; save on tab hide
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushSave();
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flushSave]);

  // ---------------- navigation & answering ----------------
  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= total) return;
      setIndex(i);
      setVisited((v) => ({ ...v, [questions[i].id]: true }));
      document.getElementById('quiz-question')?.focus({ preventScroll: true });
    },
    [total, questions]
  );

  const select = (opt: OptionId) => updateAnswers({ ...answersRef.current, [current.id]: opt });
  const clear = () => updateAnswers({ ...answersRef.current, [current.id]: null });
  const toggleMark = () => setMarked((m) => ({ ...m, [current.id]: !m[current.id] }));

  // Keyboard shortcuts (ignored while typing or when a dialog is open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showSubmit || submitting || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k in KEY_TO_OPTION) {
        const opt = current?.options[KEY_TO_OPTION[k]];
        if (opt) {
          e.preventDefault();
          updateAnswers({ ...answersRef.current, [current.id]: opt.id });
        }
      } else if (k === 'arrowright' || k === 'n') goTo(index + 1);
      else if (k === 'arrowleft' || k === 'p') goTo(index - 1);
      else if (k === 'm') setMarked((m) => ({ ...m, [current.id]: !m[current.id] }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, index, goTo, showSubmit, submitting, updateAnswers]);

  // ---------------- counts ----------------
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const markedCount = questions.filter((q) => marked[q.id]).length;
  const notVisited = questions.filter((q) => !visited[q.id]).length;
  const notAnswered = total - answeredCount;

  const paletteClass = (qid: string, i: number) => {
    const a = !!answers[qid];
    const m = !!marked[qid];
    let c = 'bg-slate-100 text-slate-700 border-slate-200'; // not visited
    if (visited[qid] && !a) c = 'bg-rose-500 text-white border-rose-600'; // visited, not answered
    if (a) c = 'bg-emerald-600 text-white border-emerald-700';
    if (m) c = `bg-violet-600 text-white border-violet-700${a ? ' ring-2 ring-emerald-400' : ''}`;
    if (i === index) c += ' outline outline-2 outline-offset-2 outline-blue-600';
    return c;
  };

  const timerTone = remainingSec < 60 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : remainingSec < 300 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800';

  if (!current) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sticky exam header */}
      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onExit} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer" aria-label={en ? 'Leave test (you can resume later)' : 'टेस्ट सोडा (नंतर पुढे सुरू करता येईल)'} title={en ? 'Leave — resume later' : 'बाहेर पडा — नंतर पुढे सुरू करा'}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{tx(session.quiz.title, lang)}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>
                {en ? 'Q' : 'प्रश्न'} {index + 1}/{total}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1" aria-live="polite">
                {saveState === 'offline' ? (
                  <>
                    <CloudOff className="w-3 h-3 text-amber-600" aria-hidden="true" /> {en ? 'offline — saved on device' : 'ऑफलाइन — डिव्हाइसवर सेव्ह'}
                  </>
                ) : (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-600" aria-hidden="true" /> {saveState === 'saving' ? (en ? 'saving…' : 'सेव्ह होत आहे…') : en ? 'saved' : 'सेव्ह झाले'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm ${timerTone}`} role="timer" aria-label={en ? 'Time remaining' : 'उरलेला वेळ'}>
            <Clock className="w-4 h-4" aria-hidden="true" />
            {formatClock(remainingSec)}
          </div>
          <button onClick={() => setShowSubmit(true)} className="px-3 sm:px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer">
            {en ? 'Submit' : 'सबमिट'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold text-xs">Q.{index + 1}</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">+{current.marks}</span>
              {current.negativeMarks > 0 && (
                <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-mono">−{current.negativeMarks}</span>
              )}
              <span className="text-[11px] text-slate-500">{current.topic}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label={en ? 'Question language' : 'प्रश्नाची भाषा'}>
              {(['mr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setQLang(l)}
                  aria-pressed={qLang === l}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${qLang === l ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'}`}
                >
                  {l === 'mr' ? 'मराठी' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <div id="quiz-question" tabIndex={-1} className="space-y-3 focus:outline-hidden">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">{tx(current.question, qLang)}</p>
            {current.image && (
              <img src={current.image} alt={en ? 'Question illustration' : 'प्रश्नासंबंधी आकृती'} className="max-h-80 rounded-xl border border-slate-200 bg-white object-contain" />
            )}
          </div>

          <div className="space-y-3" role="radiogroup" aria-label={en ? 'Answer options' : 'पर्याय'}>
            {current.options.map((opt, i) => {
              const selected = answers[current.id] === opt.id;
              const label = String.fromCharCode(65 + i); // positional label (options may be shuffled)
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => select(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                    selected ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-100' : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono ${selected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {label}
                  </span>
                  <span className={`text-xs sm:text-sm pt-0.5 leading-relaxed ${selected ? 'font-bold text-blue-950' : 'text-slate-700 font-medium'}`}>{tx(opt.text, qLang)}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMark}
                aria-pressed={!!marked[current.id]}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${marked[current.id] ? 'bg-violet-100 text-violet-800 border border-violet-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <Flag className="w-3.5 h-3.5 text-violet-600" aria-hidden="true" />
                {marked[current.id] ? (en ? 'Marked ✓' : 'रिव्ह्यू मार्क ✓') : en ? 'Mark for review' : 'Mark for Review'}
              </button>
              {answers[current.id] && (
                <button onClick={clear} className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer">
                  {en ? 'Clear' : 'उत्तर पुसा'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => goTo(index - 1)} disabled={index === 0} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {en ? 'Previous' : 'मागे'}
              </button>
              <button
                onClick={index === total - 1 ? () => setShowSubmit(true) : () => goTo(index + 1)}
                className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {index === total - 1 ? (en ? 'Review & submit' : 'रिव्ह्यू व सबमिट') : en ? 'Save & next' : 'सेव्ह व पुढे'}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4" aria-label={en ? 'Question palette' : 'प्रश्न यादी'}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">{en ? 'Question palette' : 'प्रश्न यादी'}</h3>
            <span className="text-[11px] font-mono text-slate-400">
              {answeredCount}/{total} {en ? 'answered' : 'सोडवले'}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600" aria-hidden="true" />{en ? 'Answered' : 'उत्तर दिलेले'} ({answeredCount})</li>
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" aria-hidden="true" />{en ? 'Not answered' : 'उत्तर नाही'} ({notAnswered - notVisited})</li>
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-600" aria-hidden="true" />{en ? 'Marked' : 'रिव्ह्यू'} ({markedCount})</li>
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" aria-hidden="true" />{en ? 'Not visited' : 'न पाहिलेले'} ({notVisited})</li>
          </ul>
          <div className="grid grid-cols-5 gap-2.5 pt-1 max-h-80 overflow-y-auto p-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                aria-label={`${en ? 'Question' : 'प्रश्न'} ${i + 1}${answers[q.id] ? (en ? ', answered' : ', उत्तर दिले') : ''}${marked[q.id] ? (en ? ', marked' : ', रिव्ह्यू') : ''}`}
                aria-current={i === index ? 'step' : undefined}
                className={`h-10 rounded-xl text-xs font-mono font-semibold flex items-center justify-center border cursor-pointer ${paletteClass(q.id, i)}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSubmit(true)} className="w-full py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">
            {en ? 'Submit test' : 'टेस्ट सबमिट करा'}
          </button>
          <p className="text-[10px] text-slate-400 text-center">{en ? 'Keys: 1–4 answer • ← → move • M mark' : 'की: 1–4 उत्तर • ← → • M रिव्ह्यू'}</p>
        </aside>
      </div>

      {/* Submit dialog */}
      {(showSubmit || submitting) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                {submitting ? <RefreshCw className="w-6 h-6 animate-spin" aria-hidden="true" /> : <Clock className="w-6 h-6" aria-hidden="true" />}
              </div>
              <h3 id="submit-title" className="text-lg font-bold text-slate-900">
                {submitting ? (en ? 'Submitting…' : 'सबमिट होत आहे…') : en ? 'Submit the test?' : 'टेस्ट सबमिट करायची आहे का?'}
              </h3>
              {!submitting && (
                <p className="text-xs text-slate-500">
                  {en ? `${formatClock(remainingSec)} left. You can't change answers after submitting.` : `${formatClock(remainingSec)} वेळ शिल्लक. सबमिट केल्यानंतर उत्तरे बदलता येणार नाहीत.`}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center font-mono">
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Answered' : 'सोडवले'}</span>
                <span className="text-sm font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Unanswered' : 'बाकी'}</span>
                <span className="text-sm font-bold text-rose-600">{notAnswered}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">{en ? 'Marked' : 'रिव्ह्यू'}</span>
                <span className="text-sm font-bold text-violet-600">{markedCount}</span>
              </div>
            </div>
            {submitError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-2" role="alert">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" /> {submitError}
              </p>
            )}
            {!submitting && (
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSubmit(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer" disabled={remainingSec === 0}>
                  {en ? 'Continue test' : 'सराव सुरू ठेवा'}
                </button>
                <button onClick={() => void submit(false)} className="flex-1 py-2.5 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold cursor-pointer">
                  {en ? 'Yes, submit' : 'होय, सबमिट करा'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
