'use client';

import React, { useState } from 'react';
import { HelpCircle, RefreshCw, Save } from 'lucide-react';
import { pyqAdminApi } from '@/lib/adminPyqApi';
import { EXAM_OPTIONS, QUESTION_DIFFICULTY_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { OPTION_IDS, PYQ_YEAR_MIN, pyqYearMax, type AdminPyq, type L3, type OptionId } from '@/lib/pyqTypes';
import { Modal, Toggle, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls, legendCls } from '../ui';

interface Props {
  /** null = creating a new question. */
  initial: AdminPyq | null;
  /** Pre-fills exam/year/subject/source when adding to the paper currently being worked on. */
  defaults?: { exam?: string; year?: number; subject?: string; source?: string };
  onClose: () => void;
  onSaved: (item: AdminPyq, created: boolean) => void;
  onUnauthorized: () => void;
}

type Form = {
  exam: string;
  year: string;
  subject: string;
  topic: string;
  source: string;
  questionNumber: string;
  question: L3;
  options: { id: OptionId; text: L3 }[];
  correctOption: OptionId;
  explanation: L3;
  difficulty: string;
  isPublished: boolean;
  sortOrder: string;
};

const emptyL3 = (): L3 => ({ mr: '', en: '', hi: '' });

function toForm(p: AdminPyq | null, d: Props['defaults']): Form {
  if (p) {
    return {
      exam: p.exam,
      year: String(p.year),
      subject: p.subject,
      topic: p.topic,
      source: p.source ?? '',
      questionNumber: p.questionNumber === null ? '' : String(p.questionNumber),
      question: { ...p.question },
      options: OPTION_IDS.map((id) => ({ id, text: { ...p.options.find((o) => o.id === id)!.text } })),
      correctOption: p.correctOption,
      explanation: { ...p.explanation },
      difficulty: p.difficulty,
      isPublished: p.isPublished,
      sortOrder: String(p.sortOrder),
    };
  }
  return {
    exam: d?.exam && EXAM_OPTIONS.includes(d.exam) ? d.exam : EXAM_OPTIONS[0],
    year: String(d?.year ?? new Date().getFullYear()),
    subject: d?.subject && SUBJECT_OPTIONS.includes(d.subject) ? d.subject : SUBJECT_OPTIONS[0],
    topic: '',
    source: d?.source ?? '',
    questionNumber: '',
    question: emptyL3(),
    options: OPTION_IDS.map((id) => ({ id, text: emptyL3() })),
    correctOption: 'A',
    explanation: emptyL3(),
    difficulty: 'Medium',
    isPublished: true,
    sortOrder: '0',
  };
}

/** Marathi / English / Hindi inputs for one field. Hindi falls back to Marathi when blank. */
function L3Field({
  id,
  label,
  value,
  onChange,
  rows = 2,
  maxLength,
  required,
}: {
  id: string;
  label: string;
  value: L3;
  onChange: (v: L3) => void;
  rows?: number;
  maxLength: number;
  required?: boolean;
}) {
  const langs: { key: keyof L3; tag: string; ph: string }[] = [
    { key: 'mr', tag: 'मराठी', ph: 'Marathi' },
    { key: 'en', tag: 'English', ph: 'English' },
    { key: 'hi', tag: 'हिन्दी', ph: 'Hindi (optional)' },
  ];
  return (
    <div className="col-span-full">
      <span className={labelCls}>
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {langs.map((l) => (
          <div key={l.key}>
            <label htmlFor={`${id}-${l.key}`} className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
              {l.tag}
            </label>
            <textarea
              id={`${id}-${l.key}`}
              rows={rows}
              maxLength={maxLength}
              value={value[l.key]}
              onChange={(e) => onChange({ ...value, [l.key]: e.target.value })}
              placeholder={l.ph}
              className={`${inputCls} resize-y`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PyqFormModal({ initial, defaults, onClose, onSaved, onUnauthorized }: Props) {
  const [form, setForm] = useState<Form>(() => toForm(initial, defaults));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setOption = (id: OptionId, text: L3) =>
    setForm((f) => ({ ...f, options: f.options.map((o) => (o.id === id ? { ...o, text } : o)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = {
        ...form,
        year: Number(form.year),
        questionNumber: form.questionNumber === '' ? null : Number(form.questionNumber),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const { item } = initial ? await pyqAdminApi.update(initial.id, body) : await pyqAdminApi.create(body);
      onSaved(item, !initial);
    } catch (err) {
      if (isUnauthorized(err)) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      labelledBy="pyq-form-title"
      onClose={onClose}
      wide
      title={
        <>
          <HelpCircle className="w-4 h-4 text-blue-700" aria-hidden="true" />
          {initial ? 'Edit previous-year question' : 'Add previous-year question'}
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <legend className={legendCls}>Which paper is this from?</legend>
          <div>
            <label htmlFor="pyq-exam" className={labelCls}>
              Exam <span className="text-rose-600">*</span>
            </label>
            <select id="pyq-exam" value={form.exam} onChange={(e) => set('exam', e.target.value)} className={inputCls}>
              {EXAM_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pyq-year" className={labelCls}>
              Year <span className="text-rose-600">*</span>
            </label>
            <input
              id="pyq-year"
              type="number"
              min={PYQ_YEAR_MIN}
              max={pyqYearMax()}
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="pyq-subject" className={labelCls}>
              Subject <span className="text-rose-600">*</span>
            </label>
            <select id="pyq-subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls}>
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pyq-topic" className={labelCls}>
              Topic / chapter
            </label>
            <input
              id="pyq-topic"
              value={form.topic}
              maxLength={191}
              onChange={(e) => set('topic', e.target.value)}
              placeholder="Defaults to the subject"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pyq-source" className={labelCls}>
              Paper name
            </label>
            <input
              id="pyq-source"
              value={form.source}
              maxLength={191}
              onChange={(e) => set('source', e.target.value)}
              placeholder="e.g. MPSC Rajyaseva Prelims 2024 Paper 1"
              className={inputCls}
            />
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-3">
          <legend className={legendCls}>Question</legend>
          <L3Field id="pyq-q" label="Question text" value={form.question} onChange={(v) => set('question', v)} rows={3} maxLength={4000} required />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={legendCls}>Options — tick the correct answer</legend>
          {form.options.map((o) => (
            <div key={o.id} className={`rounded-2xl border p-3 ${form.correctOption === o.id ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
              <label className="flex items-center gap-2 mb-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="pyq-correct"
                  checked={form.correctOption === o.id}
                  onChange={() => set('correctOption', o.id)}
                  className="w-4 h-4"
                />
                Option {o.id}
                {form.correctOption === o.id && <span className="text-[10px] text-emerald-700 font-semibold">correct answer</span>}
              </label>
              <div className="grid grid-cols-1 gap-2">
                <L3Field id={`pyq-opt-${o.id}`} label={`Option ${o.id} text`} value={o.text} onChange={(v) => setOption(o.id, v)} rows={1} maxLength={1000} required />
              </div>
            </div>
          ))}
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-3">
          <legend className={legendCls}>Explanation (shown after the student answers)</legend>
          <L3Field id="pyq-exp" label="Explanation" value={form.explanation} onChange={(v) => set('explanation', v)} rows={3} maxLength={6000} />
        </fieldset>

        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <legend className={legendCls}>Publishing</legend>
          <div>
            <label htmlFor="pyq-difficulty" className={labelCls}>
              Difficulty
            </label>
            <select id="pyq-difficulty" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className={inputCls}>
              {QUESTION_DIFFICULTY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pyq-number" className={labelCls}>
              Question no. on paper
            </label>
            <input
              id="pyq-number"
              type="number"
              min={1}
              max={1000}
              value={form.questionNumber}
              onChange={(e) => set('questionNumber', e.target.value)}
              placeholder="optional"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="pyq-sort" className={labelCls}>
              Sort order
            </label>
            <input id="pyq-sort" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-3">
            <Toggle
              checked={form.isPublished}
              onChange={(v) => set('isPublished', v)}
              label="Published"
              description="Unpublished questions stay hidden from students."
            />
          </div>
        </fieldset>

        {error && (
          <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
            {initial ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
