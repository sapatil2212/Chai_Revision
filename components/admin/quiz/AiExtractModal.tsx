'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Sparkles, Upload, RefreshCw, AlertTriangle, FileText, Trash2, CheckCircle2, Wand2, Info } from 'lucide-react';
import {
  quizAdminApi,
  type AiExtractResult,
  type AiMode,
  type AiQuestionDraft,
  type AiQuizDraft,
} from '@/lib/adminQuizApi';
import { OPTION_IDS, type OptionId } from '@/lib/quizTypes';
import { Modal, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls } from '../ui';

interface Props {
  /** 'both' = create a new quiz from the document; 'questions' = add to an existing quiz. */
  mode: Extract<AiMode, 'both' | 'questions'>;
  /** Marks defaults when adding to an existing quiz. */
  defaults?: { marks: number; negativeMarks: number };
  onClose: () => void;
  /** Called with the reviewed, admin-approved result. */
  onApply: (payload: { quiz: AiQuizDraft | null; questions: AiQuestionDraft[] }) => Promise<void> | void;
  onUnauthorized: () => void;
}

const ACCEPT = '.pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,application/pdf,image/*';

export function AiExtractModal({ mode, defaults, onClose, onApply, onUnauthorized }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [hint, setHint] = useState('');
  const [limit, setLimit] = useState('50');
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiExtractResult | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const kept = useMemo(
    () => (result?.questions ?? []).filter((_, i) => !excluded.has(i)),
    [result, excluded]
  );

  const fail = (err: unknown) => {
    if (isUnauthorized(err)) return onUnauthorized();
    setError((err as Error).message);
  };

  const choose = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setExcluded(new Set());
  };

  const run = async () => {
    if (!file) return setError('Choose a document first.');
    setBusy(true);
    setError('');
    try {
      const res = await quizAdminApi.aiExtract(file, {
        mode,
        limit: Number(limit) || 50,
        hint: hint.trim(),
        marks: defaults?.marks,
        negativeMarks: defaults?.negativeMarks,
      });
      setResult(res);
      setExcluded(new Set());
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!result) return;
    if (mode === 'questions' && !kept.length) return setError('Select at least one question.');
    setApplying(true);
    setError('');
    try {
      await onApply({ quiz: result.quiz, questions: kept });
    } catch (err) {
      fail(err);
    } finally {
      setApplying(false);
    }
  };

  const setAnswer = (idx: number, id: OptionId) =>
    setResult((prev) =>
      prev ? { ...prev, questions: prev.questions.map((q, i) => (i === idx ? { ...q, correctOption: id } : q)) } : prev
    );

  const toggle = (idx: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  return (
    <Modal
      wide
      labelledBy="ai-extract-title"
      onClose={onClose}
      title={
        <>
          <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />
          {mode === 'both' ? 'Create quiz from a document (AI)' : 'Extract questions from a document (AI)'}
        </>
      }
    >
      <div className="space-y-5 text-xs">
        {/* ---------------- Step 1: upload ---------------- */}
        {!result && (
          <>
            <p className="text-slate-600 leading-relaxed">
              Upload question papers, notes or an answer key. Gemini reads the file and fills in{' '}
              {mode === 'both' ? 'the quiz settings and the questions' : 'the questions'} for you in Marathi and English.
              Nothing is saved until you review and confirm.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                choose(e.dataTransfer.files?.[0]);
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? 'border-violet-400 bg-violet-50' : 'border-slate-300 bg-slate-50'}`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5 text-blue-700" aria-hidden="true" />
                  <span className="font-semibold text-slate-800">{file.name}</span>
                  <span className="text-slate-400 font-mono">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={() => setFile(null)} className="text-rose-600 hover:underline" aria-label="Remove file">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="font-semibold text-slate-700">Drag a file here, or</p>
                  <button type="button" onClick={() => inputRef.current?.click()} className={`${btnSecondary} mt-2`}>
                    Choose file
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2">PDF, Word (.docx), images or text files — up to 20 MB</p>
                </>
              )}
              <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <div>
                <label htmlFor="ai-hint" className={labelCls}>
                  Extra instructions (optional)
                </label>
                <input
                  id="ai-hint"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  className={inputCls}
                  maxLength={500}
                  placeholder="e.g. only questions from Chapter 3, or skip the English section"
                />
              </div>
              <div>
                <label htmlFor="ai-limit" className={labelCls}>
                  Max questions
                </label>
                <input id="ai-limit" type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(e.target.value)} className={`${inputCls} font-mono w-28`} />
              </div>
            </div>

            <p className="flex items-start gap-2 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              Scanned pages work too, but photos of handwriting may be read incorrectly — always check the review screen.
            </p>
          </>
        )}

        {/* ---------------- Step 2: review ---------------- */}
        {result && (
          <>
            <div className="flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2" role="status">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span className="font-semibold text-emerald-900">
                Read {result.meta.found} question(s) from “{result.meta.fileName}”.
              </span>
              <span className="text-emerald-800">Review below — nothing is saved yet.</span>
            </div>

            {result.warnings.length > 0 && (
              <ul className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 text-amber-900">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {result.quiz && (
              <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2" aria-labelledby="ai-quiz-title">
                <h4 id="ai-quiz-title" className="font-bold text-slate-800">Suggested quiz settings</h4>
                <p className="font-semibold text-slate-900">{result.quiz.title.mr || result.quiz.title.en}</p>
                {result.quiz.title.en && result.quiz.title.en !== result.quiz.title.mr && <p className="text-slate-500">{result.quiz.title.en}</p>}
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                  {[
                    ['Exam', result.quiz.exam],
                    ['Subject', result.quiz.subject],
                    ['Duration', `${result.quiz.durationMinutes} min`],
                    ['Pass', `${result.quiz.passPercentage}%`],
                    ['Marks', result.quiz.defaultMarks],
                    ['Negative', result.quiz.defaultNegativeMarks],
                    ['Difficulty', result.quiz.difficulty],
                    ['Badge', result.quiz.badge || '—'],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="bg-white rounded-lg px-2 py-1 border border-slate-200">
                      <dt className="text-slate-400 uppercase text-[9px]">{k}</dt>
                      <dd className="text-slate-800 truncate">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[11px] text-slate-500">You can change all of this on the next screen before publishing.</p>
              </section>
            )}

            {result.questions.length > 0 && (
              <section aria-labelledby="ai-q-title" className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 id="ai-q-title" className="font-bold text-slate-800">
                    Questions ({kept.length} of {result.questions.length} selected)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setExcluded(excluded.size ? new Set() : new Set(result.questions.map((_, i) => i)))}
                    className="text-blue-700 hover:underline font-semibold"
                  >
                    {excluded.size ? 'Select all' : 'Clear all'}
                  </button>
                </div>
                <ol className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
                  {result.questions.map((q, idx) => {
                    const off = excluded.has(idx);
                    return (
                      <li key={idx} className={`border rounded-2xl p-3 ${off ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={!off}
                            onChange={() => toggle(idx)}
                            className="w-4 h-4 mt-0.5 shrink-0"
                            aria-label={`Include question ${idx + 1}`}
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="font-semibold text-slate-900">
                              <span className="font-mono text-slate-400 mr-1.5">{idx + 1}.</span>
                              {q.question.mr || q.question.en}
                            </p>
                            {q.question.en && q.question.en !== q.question.mr && <p className="text-slate-500 pl-5">{q.question.en}</p>}
                            <div className="grid sm:grid-cols-2 gap-1 pl-5">
                              {q.options.map((o) => (
                                <label
                                  key={o.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer ${
                                    q.correctOption === o.id ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`ai-ans-${idx}`}
                                    checked={q.correctOption === o.id}
                                    onChange={() => setAnswer(idx, o.id)}
                                    className="w-3 h-3"
                                    aria-label={`Mark option ${o.id} correct for question ${idx + 1}`}
                                  />
                                  <span className="font-mono">{o.id}.</span>
                                  <span className="truncate">{o.text.mr || o.text.en}</span>
                                </label>
                              ))}
                            </div>
                            <p className="pl-5 text-[10px] text-slate-400 font-mono">
                              {q.difficulty} • {q.topic || '—'} • +{q.marks ?? defaults?.marks ?? 2}
                              {(q.negativeMarks ?? defaults?.negativeMarks ?? 0) > 0 ? ` / −${q.negativeMarks ?? defaults?.negativeMarks}` : ''}
                              {!(q.explanation.mr || q.explanation.en) && ' • no explanation'}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {OPTION_IDS.length === 4 && (
                  <p className="text-[11px] text-slate-500">
                    Tick the circle to correct an answer the AI got wrong. Full editing is available after import.
                  </p>
                )}
              </section>
            )}
          </>
        )}

        {error && (
          <p className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-start gap-2" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> {error}
          </p>
        )}

        {/* ---------------- Actions ---------------- */}
        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary} disabled={busy || applying}>
            Cancel
          </button>
          {result ? (
            <>
              <button type="button" onClick={() => setResult(null)} className={btnSecondary} disabled={applying}>
                Try another file
              </button>
              <button type="button" onClick={apply} disabled={applying} className={btnPrimary}>
                {applying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                {mode === 'both' ? `Continue with ${kept.length} question(s)` : `Add ${kept.length} question(s)`}
              </button>
            </>
          ) : (
            <button type="button" onClick={run} disabled={busy || !file} className={btnPrimary}>
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />}
              {busy ? 'Reading document…' : 'Read with AI'}
            </button>
          )}
        </div>
        {busy && <p className="text-[11px] text-slate-500 text-right">Long documents can take a minute or two.</p>}
      </div>
    </Modal>
  );
}
