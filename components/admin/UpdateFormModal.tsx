'use client';

import React, { useState } from 'react';
import { Bell, X, RefreshCw } from 'lucide-react';
import { adminApi, AdminApiError, type AdminUpdate } from '@/lib/adminApi';
import { EXAM_OPTIONS, UPDATE_BADGE_OPTIONS, UPDATE_CATEGORY_OPTIONS } from '@/lib/adminOptions';

interface Props {
  initial: AdminUpdate | null;
  onClose: () => void;
  onSaved: (item: AdminUpdate, mode: 'created' | 'updated') => void;
  onUnauthorized: () => void;
}

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

export function UpdateFormModal({ initial, onClose, onSaved, onUnauthorized }: Props) {
  const [form, setForm] = useState(() => ({
    titleEn: initial?.title.en ?? '',
    titleMr: initial?.title.mr ?? '',
    exam: initial?.exam ?? 'MPSC',
    category: initial?.category ?? 'Exam Notifications',
    badge: initial?.badge ?? 'NEW',
    summaryEn: initial?.shortSummary.en ?? '',
    summaryMr: initial?.shortSummary.mr ?? '',
    contentEn: initial?.fullContent.en ?? '',
    contentMr: initial?.fullContent.mr ?? '',
    lastDate: initial?.lastDate ?? '',
    examDate: initial?.examDate ?? '',
    officialLink: initial?.officialLink ?? 'https://mpsc.gov.in',
    isPublished: initial?.isPublished ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      title: { en: form.titleEn, mr: form.titleMr },
      exam: form.exam,
      category: form.category,
      badge: form.badge,
      shortSummary: { en: form.summaryEn, mr: form.summaryMr },
      fullContent: { en: form.contentEn, mr: form.contentMr },
      lastDateLabel: form.lastDate,
      examDateLabel: form.examDate,
      officialLink: form.officialLink,
      isPublished: form.isPublished,
    };
    try {
      const res = initial ? await adminApi.updateUpdate(initial.id, body) : await adminApi.createUpdate(body);
      onSaved(res.item, initial ? 'updated' : 'created');
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="update-form-title">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 id="update-form-title" className="text-base font-bold text-[#1E2653] flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-700" />
            <span>{initial ? 'Edit Exam Circular' : 'Broadcast Exam Circular'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-3.5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3" role="alert">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="u-title-en" className={labelCls}>Headline (English) *</label>
              <input id="u-title-en" required maxLength={500} value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="u-title-mr" className={labelCls}>Headline (मराठी)</label>
              <input id="u-title-mr" maxLength={500} value={form.titleMr} onChange={(e) => set('titleMr', e.target.value)} className={inputCls} placeholder="Defaults to English" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="u-exam" className={labelCls}>Exam</label>
              <select id="u-exam" value={form.exam} onChange={(e) => set('exam', e.target.value as typeof form.exam)} className={inputCls}>
                {EXAM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="u-cat" className={labelCls}>Category</label>
              <select id="u-cat" value={form.category} onChange={(e) => set('category', e.target.value as typeof form.category)} className={inputCls}>
                {UPDATE_CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="u-badge" className={labelCls}>Badge</label>
              <select id="u-badge" value={form.badge} onChange={(e) => set('badge', e.target.value as typeof form.badge)} className={`${inputCls} font-mono font-bold`}>
                {UPDATE_BADGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="u-sum-en" className={labelCls}>Short summary (English) *</label>
              <textarea id="u-sum-en" required rows={2} maxLength={1000} value={form.summaryEn} onChange={(e) => set('summaryEn', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="u-sum-mr" className={labelCls}>Short summary (मराठी)</label>
              <textarea id="u-sum-mr" rows={2} maxLength={1000} value={form.summaryMr} onChange={(e) => set('summaryMr', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="u-full-en" className={labelCls}>Full details (English)</label>
              <textarea id="u-full-en" rows={3} maxLength={10000} value={form.contentEn} onChange={(e) => set('contentEn', e.target.value)} className={inputCls} placeholder="Defaults to summary" />
            </div>
            <div>
              <label htmlFor="u-full-mr" className={labelCls}>Full details (मराठी)</label>
              <textarea id="u-full-mr" rows={3} maxLength={10000} value={form.contentMr} onChange={(e) => set('contentMr', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="u-last" className={labelCls}>Last date</label>
              <input id="u-last" maxLength={64} value={form.lastDate} onChange={(e) => set('lastDate', e.target.value)} className={inputCls} placeholder="e.g. 15 Oct 2026" />
            </div>
            <div>
              <label htmlFor="u-exam-date" className={labelCls}>Exam date</label>
              <input id="u-exam-date" maxLength={128} value={form.examDate} onChange={(e) => set('examDate', e.target.value)} className={inputCls} placeholder="e.g. 28 Nov 2026" />
            </div>
          </div>

          <div>
            <label htmlFor="u-link" className={labelCls}>Official link *</label>
            <input id="u-link" type="url" required value={form.officialLink} onChange={(e) => set('officialLink', e.target.value)} className={`${inputCls} font-mono`} />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="w-4 h-4 rounded-sm border-slate-300" />
            Published (visible on site)
          </label>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {initial ? 'Save Changes' : 'Broadcast Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
