'use client';

import React, { useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { quizAdminApi, type AdminQuiz, type AiQuizDraft } from '@/lib/adminQuizApi';
import { EXAM_OPTIONS, QUIZ_DIFFICULTY_OPTIONS, QUIZ_SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { Toggle, btnPrimary, btnSecondary, fromLocalInput, inputCls, isUnauthorized, labelCls, legendCls, toLocalInput } from '../ui';

interface Props {
  initial: AdminQuiz | null; // null = create
  /** AI-suggested values used when creating (editable before saving). */
  prefill?: AiQuizDraft | null;
  onSaved: (quiz: AdminQuiz) => void;
  onCancel?: () => void;
  onUnauthorized: () => void;
}

export function QuizSettingsForm({ initial, prefill, onSaved, onCancel, onUnauthorized }: Props) {
  const [f, setF] = useState(() => ({
    titleMr: initial?.title.mr ?? prefill?.title.mr ?? '',
    titleEn: initial?.title.en ?? prefill?.title.en ?? '',
    descMr: initial?.description.mr ?? prefill?.description.mr ?? '',
    descEn: initial?.description.en ?? prefill?.description.en ?? '',
    instrMr: initial?.instructions.mr ?? prefill?.instructions.mr ?? '',
    instrEn: initial?.instructions.en ?? prefill?.instructions.en ?? '',
    exam: initial?.exam ?? prefill?.exam ?? 'MPSC',
    subject: initial?.subject ?? prefill?.subject ?? QUIZ_SUBJECT_OPTIONS[0],
    difficulty: initial?.difficulty ?? prefill?.difficulty ?? 'Mixed',
    durationMinutes: String(initial?.durationMinutes ?? prefill?.durationMinutes ?? 30),
    passPercentage: String(initial?.passPercentage ?? prefill?.passPercentage ?? 40),
    defaultMarks: String(initial?.defaultMarks ?? prefill?.defaultMarks ?? 2),
    defaultNegativeMarks: String(initial?.defaultNegativeMarks ?? prefill?.defaultNegativeMarks ?? 0.5),
    maxAttempts: String(initial?.maxAttempts ?? 0),
    badge: initial?.badge ?? prefill?.badge ?? '',
    slug: initial?.slug ?? '',
    sortOrder: String(initial?.sortOrder ?? 0),
    startsAt: toLocalInput(initial?.startsAt),
    endsAt: toLocalInput(initial?.endsAt),
    featured: initial?.featured ?? false,
    shuffleQuestions: initial?.shuffleQuestions ?? false,
    shuffleOptions: initial?.shuffleOptions ?? false,
    showSolutions: initial?.showSolutions ?? true,
    isPublished: initial?.isPublished ?? false,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  type F = typeof f;
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!f.titleMr.trim() && !f.titleEn.trim()) return setError('Enter a title in Marathi or English.');
    setSaving(true);
    const body = {
      title: { mr: f.titleMr, en: f.titleEn },
      description: { mr: f.descMr, en: f.descEn },
      instructions: { mr: f.instrMr, en: f.instrEn },
      exam: f.exam,
      subject: f.subject,
      difficulty: f.difficulty,
      durationMinutes: f.durationMinutes,
      passPercentage: f.passPercentage,
      defaultMarks: f.defaultMarks,
      defaultNegativeMarks: f.defaultNegativeMarks,
      maxAttempts: f.maxAttempts,
      badge: f.badge,
      slug: f.slug.trim(),
      sortOrder: f.sortOrder,
      startsAt: fromLocalInput(f.startsAt),
      endsAt: fromLocalInput(f.endsAt),
      isFeatured: f.featured,
      shuffleQuestions: f.shuffleQuestions,
      shuffleOptions: f.shuffleOptions,
      showSolutions: f.showSolutions,
      isPublished: f.isPublished,
    };
    try {
      const { item } = initial ? await quizAdminApi.update(initial.id, body) : await quizAdminApi.create(body);
      onSaved(item);
    } catch (err) {
      if (isUnauthorized(err)) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const noQuestions = !initial || initial.stats.questions === 0;

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3" role="alert">
          {error}
        </div>
      )}

      <fieldset className="grid sm:grid-cols-2 gap-3">
        <legend className={legendCls}>Title & description</legend>
        <div>
          <label htmlFor="qz-title-mr" className={labelCls}>Title (मराठी)</label>
          <input id="qz-title-mr" value={f.titleMr} onChange={(e) => set('titleMr', e.target.value)} className={inputCls} maxLength={255} />
        </div>
        <div>
          <label htmlFor="qz-title-en" className={labelCls}>Title (English)</label>
          <input id="qz-title-en" value={f.titleEn} onChange={(e) => set('titleEn', e.target.value)} className={inputCls} maxLength={255} />
        </div>
        <div>
          <label htmlFor="qz-desc-mr" className={labelCls}>Short description (मराठी)</label>
          <textarea id="qz-desc-mr" rows={2} value={f.descMr} onChange={(e) => set('descMr', e.target.value)} className={inputCls} maxLength={2000} />
        </div>
        <div>
          <label htmlFor="qz-desc-en" className={labelCls}>Short description (English)</label>
          <textarea id="qz-desc-en" rows={2} value={f.descEn} onChange={(e) => set('descEn', e.target.value)} className={inputCls} maxLength={2000} />
        </div>
        <div>
          <label htmlFor="qz-instr-mr" className={labelCls}>Instructions before start (मराठी, one per line)</label>
          <textarea id="qz-instr-mr" rows={3} value={f.instrMr} onChange={(e) => set('instrMr', e.target.value)} className={inputCls} maxLength={4000} placeholder="Leave empty for standard instructions" />
        </div>
        <div>
          <label htmlFor="qz-instr-en" className={labelCls}>Instructions before start (English)</label>
          <textarea id="qz-instr-en" rows={3} value={f.instrEn} onChange={(e) => set('instrEn', e.target.value)} className={inputCls} maxLength={4000} />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <legend className={legendCls}>Classification</legend>
        <div>
          <label htmlFor="qz-exam" className={labelCls}>Exam</label>
          <select id="qz-exam" value={f.exam} onChange={(e) => set('exam', e.target.value)} className={inputCls}>
            {EXAM_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="qz-subject" className={labelCls}>Subject</label>
          <select id="qz-subject" value={f.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls}>
            {QUIZ_SUBJECT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="qz-diff" className={labelCls}>Difficulty</label>
          <select id="qz-diff" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value as F['difficulty'])} className={inputCls}>
            {QUIZ_DIFFICULTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="qz-badge" className={labelCls}>Badge (optional)</label>
          <input id="qz-badge" value={f.badge} onChange={(e) => set('badge', e.target.value)} className={inputCls} maxLength={64} placeholder="e.g. Weekly Mock" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <legend className={legendCls}>Exam rules</legend>
        <div>
          <label htmlFor="qz-dur" className={labelCls}>Duration (min)</label>
          <input id="qz-dur" type="number" min={1} max={600} value={f.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label htmlFor="qz-pass" className={labelCls}>Pass mark (%)</label>
          <input id="qz-pass" type="number" min={0} max={100} value={f.passPercentage} onChange={(e) => set('passPercentage', e.target.value)} className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label htmlFor="qz-marks" className={labelCls}>Marks / question</label>
          <input id="qz-marks" type="number" min={0.25} step={0.25} value={f.defaultMarks} onChange={(e) => set('defaultMarks', e.target.value)} className={`${inputCls} font-mono`} aria-describedby="qz-marks-help" />
        </div>
        <div>
          <label htmlFor="qz-neg" className={labelCls}>Negative / wrong</label>
          <input id="qz-neg" type="number" min={0} step={0.25} value={f.defaultNegativeMarks} onChange={(e) => set('defaultNegativeMarks', e.target.value)} className={`${inputCls} font-mono`} aria-describedby="qz-marks-help" />
        </div>
        <div>
          <label htmlFor="qz-max" className={labelCls}>Max attempts</label>
          <input id="qz-max" type="number" min={0} max={100} value={f.maxAttempts} onChange={(e) => set('maxAttempts', e.target.value)} className={`${inputCls} font-mono`} aria-describedby="qz-max-help" />
        </div>
        <p id="qz-marks-help" className="col-span-full text-[11px] text-slate-500 -mt-1">
          Marks are defaults for new questions. To change existing questions use “Apply marks to all” in the Questions tab.
          <span id="qz-max-help"> Max attempts per student browser; 0 = unlimited.</span>
        </p>
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-3">
        <legend className={legendCls}>Schedule (optional)</legend>
        <div>
          <label htmlFor="qz-start" className={labelCls}>Opens at</label>
          <input id="qz-start" type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="qz-end" className={labelCls}>Closes at</label>
          <input id="qz-end" type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt', e.target.value)} className={inputCls} />
        </div>
        <p className="col-span-full text-[11px] text-slate-500 -mt-1">
          Leave both empty for an always-open practice test. With a schedule, students see “Upcoming” with a countdown, then “Live”, then “Ended”.
        </p>
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-3">
        <legend className={legendCls}>Behaviour & visibility</legend>
        <Toggle checked={f.shuffleQuestions} onChange={(v) => set('shuffleQuestions', v)} label="Shuffle question order" description="Each student gets a different order" />
        <Toggle checked={f.shuffleOptions} onChange={(v) => set('shuffleOptions', v)} label="Shuffle options" description="A–D order changes per student" />
        <Toggle checked={f.showSolutions} onChange={(v) => set('showSolutions', v)} label="Show answers & explanations after submit" />
        <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Featured" description="Highlighted at the top of the quiz page" />
        <Toggle
          checked={f.isPublished}
          onChange={(v) => set('isPublished', v)}
          label="Published (visible on website)"
          description={noQuestions ? 'Add at least one question first' : undefined}
          disabled={noQuestions}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qz-sort" className={labelCls}>Display order</label>
            <input id="qz-sort" type="number" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label htmlFor="qz-slug" className={labelCls}>URL slug</label>
            <input id="qz-slug" value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} className={`${inputCls} font-mono`} placeholder="auto" maxLength={120} />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
          {initial ? 'Save settings' : 'Create quiz & add questions'}
        </button>
      </div>
    </form>
  );
}
