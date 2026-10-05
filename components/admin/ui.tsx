'use client';

import React from 'react';
import { quizStatus, type QuizSummary } from '@/lib/quizTypes';

export const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white disabled:opacity-50';
export const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
export const legendCls = 'col-span-full text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1';
export const btnPrimary =
  'inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50';
export const btnSecondary =
  'inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50';

export type ToastFn = (text: string, type?: 'success' | 'info' | 'error') => void;

export const isUnauthorized = (err: unknown) => (err as { status?: number })?.status === 401;

/** ISO → value for <input type="datetime-local"> in the admin's local timezone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO string (or '' to clear). */
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : '');

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2.5 text-xs cursor-pointer select-none ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 shrink-0"
      />
      <span>
        <span className="font-semibold text-slate-800">{label}</span>
        {description && <span className="block text-[11px] text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function ScheduleBadge({ quiz }: { quiz: Pick<QuizSummary, 'startsAt' | 'endsAt'> }) {
  const s = quizStatus(quiz);
  const cls =
    s === 'live'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'upcoming'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-500 border-slate-200';
  const label = s === 'live' ? (quiz.endsAt ? 'Live' : 'Always open') : s === 'upcoming' ? 'Scheduled' : 'Ended';
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cls}`}>{label}</span>;
}

export function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200">Published</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-slate-100 text-slate-600 border-slate-200">Draft</span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
  labelledBy,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  labelledBy: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className={`bg-white rounded-3xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[94vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 id={labelledBy} className="text-base font-bold text-[#1E2653] flex items-center gap-2">
            {title}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
