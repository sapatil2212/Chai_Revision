'use client';

import React, { useState } from 'react';
import { HelpCircle, RefreshCw, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { quizAdminApi, type AdminQuestion, type AdminQuiz } from '@/lib/adminQuizApi';
import { QUESTION_DIFFICULTY_OPTIONS, adminPreviewUrl } from '@/lib/adminOptions';
import { OPTION_IDS, type OptionId } from '@/lib/quizTypes';
import { Modal, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls, legendCls } from '../ui';

interface Props {
  quiz: AdminQuiz;
  initial: AdminQuestion | null;
  onClose: () => void;
  onSaved: (q: AdminQuestion, mode: 'created' | 'updated', keepOpen: boolean) => void;
  onUnauthorized: () => void;
}

type Opt = { mr: string; en: string };

export function QuestionFormModal({ quiz, initial, onClose, onSaved, onUnauthorized }: Props) {
  const emptyForm = () => ({
    qMr: '',
    qEn: '',
    options: Object.fromEntries(OPTION_IDS.map((id) => [id, { mr: '', en: '' }])) as Record<OptionId, Opt>,
    correct: 'A' as OptionId,
    exMr: '',
    exEn: '',
    marks: String(quiz.defaultMarks),
    negativeMarks: String(quiz.defaultNegativeMarks),
    difficulty: 'Medium',
    topic: '',
    image: '',
  });
  const [f, setF] = useState(() =>
    initial
      ? {
          qMr: initial.question.mr,
          qEn: initial.question.en,
          options: Object.fromEntries(initial.options.map((o) => [o.id, { mr: o.text.mr, en: o.text.en }])) as Record<OptionId, Opt>,
          correct: initial.correctOption,
          exMr: initial.explanation.mr,
          exEn: initial.explanation.en,
          marks: String(initial.marks),
          negativeMarks: String(initial.negativeMarks),
          difficulty: initial.difficulty,
          topic: initial.topic === quiz.subject ? '' : initial.topic,
          image: initial.image ?? '',
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  type F = typeof f;
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }));
  const setOpt = (id: OptionId, lang: keyof Opt, value: string) =>
    setF((p) => ({ ...p, options: { ...p.options, [id]: { ...p.options[id], [lang]: value } } }));

  const fail = (err: unknown) => (isUnauthorized(err) ? onUnauthorized() : setError((err as Error).message));

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      set('image', (await adminApi.upload(file, 'image')).ref);
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  const save = async (keepOpen: boolean) => {
    setError('');
    if (!f.qMr.trim() && !f.qEn.trim()) return setError('Enter the question in Marathi or English.');
    const blank = OPTION_IDS.find((id) => !f.options[id].mr.trim() && !f.options[id].en.trim());
    if (blank) return setError(`Option ${blank} is empty.`);
    setSaving(true);
    const body = {
      question: { mr: f.qMr, en: f.qEn },
      options: OPTION_IDS.map((id) => ({ id, text: f.options[id] })),
      correctOption: f.correct,
      explanation: { mr: f.exMr, en: f.exEn },
      marks: f.marks,
      negativeMarks: f.negativeMarks,
      difficulty: f.difficulty,
      topic: f.topic,
      image: f.image,
    };
    try {
      const { item } = initial
        ? await quizAdminApi.updateQuestion(quiz.id, initial.id, body)
        : await quizAdminApi.addQuestion(quiz.id, body);
      onSaved(item, initial ? 'updated' : 'created', keepOpen);
      if (keepOpen) {
        // "Save & add another": keep marks/difficulty/topic, clear the content
        setF((p) => ({ ...emptyForm(), marks: p.marks, negativeMarks: p.negativeMarks, difficulty: p.difficulty, topic: p.topic }));
        setSavedCount((n) => n + 1);
        document.getElementById('qq-mr')?.focus();
      }
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      labelledBy="question-form-title"
      onClose={onClose}
      title={
        <>
          <HelpCircle className="w-4 h-4 text-blue-700" aria-hidden="true" />
          {initial ? `Edit question ${initial.position + 1}` : 'Add question'}
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="space-y-5"
        noValidate
      >
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3" role="alert">
            {error}
          </div>
        )}
        {savedCount > 0 && !error && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2" role="status">
            {savedCount} question(s) added. Enter the next one.
          </p>
        )}

        <fieldset className="grid sm:grid-cols-2 gap-3">
          <legend className={legendCls}>Question</legend>
          <div>
            <label htmlFor="qq-mr" className={labelCls}>मराठी</label>
            <textarea id="qq-mr" rows={3} value={f.qMr} onChange={(e) => set('qMr', e.target.value)} className={inputCls} maxLength={4000} autoFocus />
          </div>
          <div>
            <label htmlFor="qq-en" className={labelCls}>English</label>
            <textarea id="qq-en" rows={3} value={f.qEn} onChange={(e) => set('qEn', e.target.value)} className={inputCls} maxLength={4000} />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={legendCls}>Options — select the correct answer</legend>
          {OPTION_IDS.map((id) => {
            const isCorrect = f.correct === id;
            return (
              <div key={id} className={`grid grid-cols-[auto_1fr_1fr] gap-2 items-center p-2 rounded-xl border ${isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
                <label className="flex items-center gap-1.5 cursor-pointer pr-1" title="Mark as correct answer">
                  <input type="radio" name="correct" checked={isCorrect} onChange={() => set('correct', id)} className="w-4 h-4" aria-label={`Option ${id} is correct`} />
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{id}</span>
                </label>
                <input aria-label={`Option ${id} (मराठी)`} value={f.options[id].mr} onChange={(e) => setOpt(id, 'mr', e.target.value)} className={inputCls} placeholder="मराठी" maxLength={1000} />
                <input aria-label={`Option ${id} (English)`} value={f.options[id].en} onChange={(e) => setOpt(id, 'en', e.target.value)} className={inputCls} placeholder="English" maxLength={1000} />
              </div>
            );
          })}
        </fieldset>

        <fieldset className="grid sm:grid-cols-2 gap-3">
          <legend className={legendCls}>Explanation (shown after submit)</legend>
          <textarea aria-label="Explanation (मराठी)" rows={3} value={f.exMr} onChange={(e) => set('exMr', e.target.value)} className={inputCls} placeholder="मराठी" maxLength={6000} />
          <textarea aria-label="Explanation (English)" rows={3} value={f.exEn} onChange={(e) => set('exEn', e.target.value)} className={inputCls} placeholder="English" maxLength={6000} />
        </fieldset>

        <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <legend className={legendCls}>Scoring & tags</legend>
          <div>
            <label htmlFor="qq-marks" className={labelCls}>Marks</label>
            <input id="qq-marks" type="number" min={0.25} step={0.25} value={f.marks} onChange={(e) => set('marks', e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label htmlFor="qq-neg" className={labelCls}>Negative marks</label>
            <input id="qq-neg" type="number" min={0} step={0.25} value={f.negativeMarks} onChange={(e) => set('negativeMarks', e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label htmlFor="qq-diff" className={labelCls}>Difficulty</label>
            <select id="qq-diff" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value as F['difficulty'])} className={inputCls}>
              {QUESTION_DIFFICULTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="qq-topic" className={labelCls}>Topic</label>
            <input id="qq-topic" value={f.topic} onChange={(e) => set('topic', e.target.value)} className={inputCls} maxLength={64} placeholder={quiz.subject} />
          </div>
        </fieldset>

        <fieldset>
          <legend className={legendCls}>Image (optional — maps, diagrams, tables)</legend>
          <div className="flex items-center gap-3">
            {f.image ? (
              <>
                <img src={adminPreviewUrl(f.image)} alt="Question illustration preview" className="h-20 rounded-lg border border-slate-200 object-contain bg-white" />
                <button type="button" onClick={() => set('image', '')} className="text-xs text-rose-600 inline-flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Remove
                </button>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">No image</p>
            )}
            <label className={`${btnSecondary} focus-within:ring-2 focus-within:ring-blue-300`}>
              {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading…' : f.image ? 'Replace' : 'Upload image'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadImage} disabled={uploading} />
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>
            {savedCount ? 'Done' : 'Cancel'}
          </button>
          {!initial && (
            <button type="button" disabled={saving || uploading} onClick={() => save(true)} className={btnSecondary}>
              Save & add another
            </button>
          )}
          <button type="submit" disabled={saving || uploading} className={btnPrimary}>
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
            {initial ? 'Save question' : 'Save question'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
