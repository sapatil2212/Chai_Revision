'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  EyeOff,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { pyqAdminApi, type PyqListPage, type PyqListQuery } from '@/lib/adminPyqApi';
import { EXAM_OPTIONS, QUESTION_DIFFICULTY_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import type { AdminPyq } from '@/lib/pyqTypes';
import { PyqFormModal } from './PyqFormModal';
import { PyqCsvImportModal } from './PyqCsvImportModal';
import { PyqAiExtractModal } from './PyqAiExtractModal';
import { PublishBadge, btnPrimary, btnSecondary, isUnauthorized, type ToastFn } from '../ui';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

interface Props {
  globalSearch: string;
  showToast: ToastFn;
  onUnauthorized: () => void;
  onCountChange?: (n: number) => void;
}

const PAGE_SIZE = 20;
const selectCls = 'bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-[#1E2653] font-mono mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

/** Previous-year question bank: filter, edit, bulk publish, CSV and AI paper import. */
export function PyqsManager({ globalSearch, showToast, onUnauthorized, onCountChange }: Props) {
  const dialog = useAdminDialog();
  const [page, setPage] = useState<PyqListPage | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // debounced
  const [exam, setExam] = useState('All');
  const [year, setYear] = useState('All');
  const [subject, setSubject] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [offset, setOffset] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<AdminPyq | null>(null);
  const [modal, setModal] = useState<null | 'form' | 'csv' | 'ai'>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fail = useCallback(
    (err: unknown, action: string) => {
      if (isUnauthorized(err)) return onUnauthorized();
      showToast(`${action} failed: ${(err as Error).message}`, 'error');
    },
    [onUnauthorized, showToast]
  );

  // Typing shouldn't hit the API on every keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(`${query} ${globalSearch}`.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(id);
  }, [query, globalSearch]);

  const listQuery: PyqListQuery = {
    exam,
    year: year === 'All' ? undefined : year,
    subject,
    difficulty,
    search,
    limit: PAGE_SIZE,
    offset,
  };

  const load = useCallback(() => {
    return pyqAdminApi
      .list({ exam, year: year === 'All' ? undefined : year, subject, difficulty, search, limit: PAGE_SIZE, offset })
      .then((p) => {
        setPage(p);
        onCountChange?.(p.stats.total);
      })
      .catch((err) => fail(err, 'Loading questions'))
      .finally(() => setLoading(false));
  }, [exam, year, subject, difficulty, search, offset, fail, onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = (msg?: string) => {
    if (msg) showToast(msg, 'success');
    setSelected(new Set());
    setLoading(true);
    void load();
  };

  // Status is filtered client-side; everything else is a server query
  const items = (page?.items ?? []).filter((p) =>
    status === 'all' ? true : status === 'published' ? p.isPublished : !p.isPublished
  );
  const stats = page?.stats;
  const filters = page?.filters;
  const total = page?.total ?? 0;
  const from = total ? offset + 1 : 0;
  const to = Math.min(offset + PAGE_SIZE, total);

  const openForm = (item: AdminPyq | null) => {
    setFormTarget(item);
    setModal('form');
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOnPageSelected = items.length > 0 && items.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) items.forEach((p) => next.delete(p.id));
      else items.forEach((p) => next.add(p.id));
      return next;
    });

  const runAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === 'delete') {
      const ok = await dialog.confirm({
        title: `Delete ${ids.length} Question${ids.length > 1 ? 's' : ''}?`,
        message: `Are you sure you want to permanently delete ${ids.length} selected PYQ question${ids.length > 1 ? 's' : ''}?`,
        note: 'This action cannot be undone. Questions will be removed from all student practice sets.',
        confirmText: `Delete ${ids.length} Question${ids.length > 1 ? 's' : ''}`,
        variant: 'danger',
      });
      if (!ok) return;
    }
    try {
      const { affected } = await pyqAdminApi.action(ids, action);
      reload(`${affected} question(s) ${action === 'delete' ? 'deleted' : `${action}ed`}.`);
    } catch (err) {
      fail(err, 'Bulk update');
    }
  };

  const togglePublish = async (p: AdminPyq) => {
    setBusyId(p.id);
    try {
      const { item } = await pyqAdminApi.update(p.id, { isPublished: !p.isPublished });
      setPage((prev) => (prev ? { ...prev, items: prev.items.map((x) => (x.id === item.id ? item : x)) } : prev));
      showToast(item.isPublished ? 'Question published.' : 'Question moved to drafts.', 'success');
    } catch (err) {
      fail(err, 'Publish');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (p: AdminPyq) => {
    setBusyId(p.id);
    try {
      await pyqAdminApi.duplicate(p.id);
      reload('Question duplicated as a draft.');
    } catch (err) {
      fail(err, 'Duplicate');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: AdminPyq) => {
    const snippet = p.question?.en || p.question?.mr || 'this question';
    const preview = snippet.length > 80 ? snippet.slice(0, 80) + '…' : snippet;
    const ok = await dialog.confirm({
      title: 'Delete PYQ Question?',
      message: `Are you sure you want to delete "${preview}"?`,
      note: 'This action is permanent and cannot be undone.',
      confirmText: 'Delete Question',
      variant: 'danger',
    });
    if (!ok) return;

    setBusyId(p.id);
    try {
      await pyqAdminApi.remove(p.id);
      reload('Question deleted.');
    } catch (err) {
      fail(err, 'Delete');
    } finally {
      setBusyId(null);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setExam('All');
    setYear('All');
    setSubject('All');
    setDifficulty('All');
    setStatus('all');
    setOffset(0);
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 flex-1">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E2653]">PYQ Question Bank</h1>
          <p className="text-xs text-slate-500 mt-1">
            Previous-year questions students practise from. Import a real paper with AI, or add questions by hand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => reload()} className={btnSecondary} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
          </button>
          <a href={pyqAdminApi.exportUrl(listQuery)} className={btnSecondary} download>
            <Download className="w-4 h-4" aria-hidden="true" /> Export CSV
          </a>
          <button onClick={() => setModal('csv')} className={btnSecondary}>
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> Import CSV
          </button>
          <button onClick={() => setModal('ai')} className={btnSecondary}>
            <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" /> Import paper with AI
          </button>
          <button onClick={() => openForm(null)} className={btnPrimary}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add question
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Questions" value={stats?.total ?? '—'} hint={stats ? `${stats.drafts} draft(s)` : undefined} />
        <StatCard label="Published" value={stats?.published ?? '—'} hint="Visible to students" />
        <StatCard label="Years covered" value={stats?.years ?? '—'} hint={stats?.byYear.length ? `latest ${stats.byYear[0].year}` : undefined} />
        <StatCard label="Exams" value={stats?.exams ?? '—'} />
        <StatCard label="Subjects" value={stats?.subjects ?? '—'} />
      </div>

      {stats && stats.byYear.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Questions per year</p>
          <div className="flex flex-wrap gap-2">
            {stats.byYear.map((y) => (
              <button
                key={y.year}
                onClick={() => {
                  setYear(String(y.year));
                  setOffset(0);
                }}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold cursor-pointer ${
                  year === String(y.year)
                    ? 'bg-[#1C2C5B] text-white border-[#1C2C5B]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {y.year} <span className="font-mono opacity-70">({y.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search question text, topic or paper…"
              aria-label="Search questions"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            />
          </div>
          <select value={exam} onChange={(e) => { setExam(e.target.value); setOffset(0); }} aria-label="Filter by exam" className={selectCls}>
            <option value="All">All exams</option>
            {(filters?.exams.length ? filters.exams : EXAM_OPTIONS).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => { setYear(e.target.value); setOffset(0); }} aria-label="Filter by year" className={selectCls}>
            <option value="All">All years</option>
            {(filters?.years ?? []).map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select value={subject} onChange={(e) => { setSubject(e.target.value); setOffset(0); }} aria-label="Filter by subject" className={selectCls}>
            <option value="All">All subjects</option>
            {(filters?.subjects.length ? filters.subjects : SUBJECT_OPTIONS).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setOffset(0); }} aria-label="Filter by difficulty" className={selectCls}>
            <option value="All">Any difficulty</option>
            {QUESTION_DIFFICULTY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status" className={selectCls}>
            <option value="all">Published & drafts</option>
            <option value="published">Published only</option>
            <option value="draft">Drafts only</option>
          </select>
          <button onClick={resetFilters} className={btnSecondary}>Clear</button>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs">
            <span className="font-semibold text-blue-900">{selected.size} selected</span>
            <button onClick={() => runAction('publish')} className={btnSecondary}>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Publish
            </button>
            <button onClick={() => runAction('unpublish')} className={btnSecondary}>
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Unpublish
            </button>
            <button
              onClick={() => runAction('delete')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-800 underline cursor-pointer">
              Clear selection
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                    className="w-3.5 h-3.5"
                  />
                </th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Paper</th>
                <th className="py-3 px-4">Subject / topic</th>
                <th className="py-3 px-4">Answer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && !items.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" /> Loading questions…
                  </td>
                </tr>
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <HelpCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" aria-hidden="true" />
                    {total === 0 && !search && exam === 'All' && year === 'All'
                      ? 'No previous-year questions yet. Import a paper with AI to get started.'
                      : 'No question matches these filters.'}
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${selected.has(p.id) ? 'bg-blue-50/40' : ''}`}>
                  <td className="py-3 px-3 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Select question ${p.questionNumber ?? p.id}`}
                      className="w-3.5 h-3.5 mt-1"
                    />
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="font-semibold text-slate-900 line-clamp-2">{p.question.mr || p.question.en}</p>
                    {p.question.en && p.question.mr !== p.question.en && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.question.en}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-semibold">
                      {p.exam} {p.year}
                    </span>
                    {p.source && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 max-w-40">{p.source}</p>}
                    {p.questionNumber !== null && <p className="text-[10px] text-slate-400 font-mono">Q{p.questionNumber}</p>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-44">
                    <span className="line-clamp-1">{p.subject}</span>
                    <span className="block text-[10px] text-slate-400 line-clamp-1">{p.topic}</span>
                    <span className="block text-[10px] text-slate-400">{p.difficulty}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
                      {p.correctOption}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button onClick={() => togglePublish(p)} disabled={busyId === p.id} className="cursor-pointer disabled:opacity-50" title="Toggle published">
                      <PublishBadge published={p.isPublished} />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button onClick={() => openForm(p)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg cursor-pointer" title="Edit" aria-label="Edit question">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => duplicate(p)} disabled={busyId === p.id} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50" title="Duplicate" aria-label="Duplicate question">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(p)} disabled={busyId === p.id} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-50" title="Delete" aria-label="Delete question">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-mono">
              {from}–{to} of {total}
              {status !== 'all' && ' (status filter applied to this page)'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0 || loading} className={btnSecondary}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Previous
              </button>
              <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={to >= total || loading} className={btnSecondary}>
                Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <PyqFormModal
          initial={formTarget}
          defaults={{
            exam: exam !== 'All' ? exam : undefined,
            year: year !== 'All' ? Number(year) : undefined,
            subject: subject !== 'All' ? subject : undefined,
          }}
          onClose={() => setModal(null)}
          onSaved={(_item, created) => {
            setModal(null);
            reload(created ? 'Question added.' : 'Question updated.');
          }}
          onUnauthorized={onUnauthorized}
        />
      )}

      {modal === 'csv' && (
        <PyqCsvImportModal
          onClose={() => setModal(null)}
          onImported={(n) => {
            setModal(null);
            reload(`${n} question(s) imported.`);
          }}
          onUnauthorized={onUnauthorized}
        />
      )}

      {modal === 'ai' && (
        <PyqAiExtractModal
          onClose={() => setModal(null)}
          onSaved={(n) => {
            setModal(null);
            reload(`${n} question(s) saved from the paper.`);
          }}
          onUnauthorized={onUnauthorized}
        />
      )}
    </main>
  );
}
