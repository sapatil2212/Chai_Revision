'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { pyqAdminApi, type AiPyqDraft, type PyqAiResult } from '@/lib/adminPyqApi';
import { EXAM_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { OPTION_IDS, PYQ_YEAR_MIN, pyqYearMax, type OptionId } from '@/lib/pyqTypes';
import { Modal, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls, legendCls } from '../ui';

interface Props {
  onClose: () => void;
  onSaved: (count: number) => void;
  onUnauthorized: () => void;
}

const ACCEPT = '.pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp';

/** Reads a real previous-year paper with Gemini, then lets the admin review before saving. */
export function PyqAiExtractModal({ onClose, onSaved, onUnauthorized }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [exam, setExam] = useState('');
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [source, setSource] = useState('');
  const [limit, setLimit] = useState('60');
  const [hint, setHint] = useState('');

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PyqAiResult | null>(null);
  const [drafts, setDrafts] = useState<AiPyqDraft[]>([]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    setError('');
    setResult(null);
    setDrafts([]);
    setFile(f);
    if (!source) setSource(f.name.replace(/\.[^.]+$/, '').slice(0, 150));
  };

  const extract = async () => {
    if (!file) return setError('Choose a question paper to upload.');
    setError('');
    setBusy(true);
    try {
      const res = await pyqAdminApi.aiExtract(file, { limit: Number(limit) || 60, hint, exam, year, subject, source });
      setResult(res);
      setDrafts(res.questions);
      // Fill the form from what the model read off the paper
      if (res.paper) {
        if (!exam) setExam(res.paper.exam);
        if (!year) setYear(String(res.paper.year));
        if (!subject) setSubject(res.paper.subject);
        if (!source) setSource(res.paper.source);
      }
    } catch (err) {
      if (isUnauthorized(err)) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!drafts.length) return;
    setError('');
    setSaving(true);
    try {
      const { inserted } = await pyqAdminApi.addBulk(
        drafts.map((d) => ({
          ...d,
          // Admin edits in this modal override whatever the model tagged
          exam: exam || d.exam,
          year: Number(year) || d.year,
          source: source || d.source,
        }))
      );
      onSaved(inserted);
    } catch (err) {
      if (isUnauthorized(err)) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const drop = (i: number) => setDrafts((list) => list.filter((_, idx) => idx !== i));
  const setAnswer = (i: number, id: OptionId) =>
    setDrafts((list) => list.map((d, idx) => (idx === i ? { ...d, correctOption: id } : d)));

  return (
    <Modal
      labelledBy="pyq-ai-title"
      onClose={onClose}
      wide
      title={
        <>
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" /> Import a question paper with AI
        </>
      }
    >
      <div className="space-y-5 text-xs">
        <p className="text-slate-600 bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2.5">
          Upload a real previous-year paper (PDF, Word, image or text). Gemini transcribes the questions, reads the answer
          key and tags each question. Questions whose answer is not stated in the document are skipped rather than guessed.
          Nothing is saved until you press <strong>Save</strong>.
        </p>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <legend className={legendCls}>The paper</legend>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className={`${btnSecondary} focus-within:ring-2 focus-within:ring-blue-300`}>
              <FileUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{file ? file.name : 'Choose question paper'}</span>
              <input type="file" accept={ACCEPT} className="sr-only" onChange={pickFile} />
            </label>
            {file && <span className="ml-2 text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
          </div>

          <div>
            <label htmlFor="ai-exam" className={labelCls}>
              Exam <span className="font-normal text-slate-400">(auto-detected if blank)</span>
            </label>
            <select id="ai-exam" value={exam} onChange={(e) => setExam(e.target.value)} className={inputCls}>
              <option value="">Detect from paper</option>
              {EXAM_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-year" className={labelCls}>
              Year <span className="font-normal text-slate-400">(auto-detected if blank)</span>
            </label>
            <input
              id="ai-year"
              type="number"
              min={PYQ_YEAR_MIN}
              max={pyqYearMax()}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Detect from paper"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="ai-subject" className={labelCls}>
              Subject <span className="font-normal text-slate-400">(per question if blank)</span>
            </label>
            <select id="ai-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
              <option value="">Tag each question</option>
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ai-source" className={labelCls}>
              Paper name
            </label>
            <input
              id="ai-source"
              value={source}
              maxLength={150}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. MPSC Rajyaseva Prelims 2024 Paper 1"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="ai-limit" className={labelCls}>
              Max questions
            </label>
            <input id="ai-limit" type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="ai-hint" className={labelCls}>
              Extra guidance (optional)
            </label>
            <input
              id="ai-hint"
              value={hint}
              maxLength={500}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. the answer key is the grid on the last page"
              className={inputCls}
            />
          </div>
        </fieldset>

        {error && (
          <p className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-3 py-2 flex items-start gap-2" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" /> {error}
          </p>
        )}

        {!result && (
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancel
            </button>
            <button type="button" onClick={extract} disabled={busy || !file} className={btnPrimary}>
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
              {busy ? 'Reading the paper…' : 'Read with AI'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                {drafts.length} question(s) ready
                {result.meta.skipped ? ` · ${result.meta.skipped} skipped` : ''}
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">
                {result.meta.fileName} · {result.meta.kind} · {result.meta.model}
              </span>
            </div>

            {result.warnings.length > 0 && (
              <ul className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 space-y-1 text-amber-900 list-disc pl-6">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {drafts.map((d, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        #{d.questionNumber ?? i + 1} · {d.subject} · {d.topic || '—'} · {d.difficulty}
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">{d.question.mr || d.question.en}</p>
                      {d.question.en && d.question.mr && <p className="text-slate-500">{d.question.en}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => drop(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      title="Remove this question"
                      aria-label={`Remove question ${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {OPTION_IDS.map((id) => {
                      const opt = d.options.find((o) => o.id === id);
                      const correct = d.correctOption === id;
                      return (
                        <label
                          key={id}
                          className={`flex items-start gap-2 rounded-xl border px-2.5 py-1.5 cursor-pointer ${
                            correct ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`ai-correct-${i}`}
                            checked={correct}
                            onChange={() => setAnswer(i, id)}
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          />
                          <span>
                            <span className="font-mono mr-1">{id}.</span>
                            {opt?.text.mr || opt?.text.en}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {(d.explanation.mr || d.explanation.en) && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
                      {d.explanation.mr || d.explanation.en}
                    </p>
                  )}
                </div>
              ))}
              {!drafts.length && <p className="text-slate-500 text-center py-6">You removed every question.</p>}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className={btnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setDrafts([]);
                }}
                className={btnSecondary}
              >
                Start over
              </button>
              <button type="button" onClick={save} disabled={saving || !drafts.length} className={btnPrimary}>
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                Save {drafts.length} question(s)
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
