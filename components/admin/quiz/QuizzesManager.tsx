'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Copy, Trash2, Settings2, ClipboardList, Star, Sparkles } from 'lucide-react';
import { quizAdminApi, type AdminQuiz, type AiQuestionDraft, type AiQuizDraft } from '@/lib/adminQuizApi';
import { AiExtractModal } from './AiExtractModal';
import { EXAM_OPTIONS } from '@/lib/adminOptions';
import { quizStatus } from '@/lib/quizTypes';
import { QuizEditor } from './QuizEditor';
import { QuizSettingsForm } from './QuizSettingsForm';
import { Modal, PublishBadge, ScheduleBadge, btnPrimary, btnSecondary, fmtDateTime, isUnauthorized, type ToastFn } from '../ui';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

interface Props {
  globalSearch: string;
  showToast: ToastFn;
  onUnauthorized: () => void;
  onCountChange?: (n: number) => void;
}

const selectCls = 'bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600';

export function QuizzesManager({ globalSearch, showToast, onUnauthorized, onCountChange }: Props) {
  const dialog = useAdminDialog();
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  // AI-extracted data waiting to be confirmed in the create form
  const [aiDraft, setAiDraft] = useState<{ quiz: AiQuizDraft | null; questions: AiQuestionDraft[] } | null>(null);
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState('All');
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'live' | 'upcoming' | 'ended'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fail = useCallback(
    (err: unknown, action: string) => {
      if (isUnauthorized(err)) return onUnauthorized();
      showToast(`${action} failed: ${(err as Error).message}`, 'error');
    },
    [onUnauthorized, showToast]
  );

  const apply = useCallback(
    (items: AdminQuiz[]) => {
      setQuizzes(items);
      onCountChange?.(items.length);
    },
    [onCountChange]
  );

  const load = useCallback(
    () =>
      quizAdminApi
        .list()
        .then(({ items }) => apply(items))
        .catch((err) => fail(err, 'Loading quizzes'))
        .finally(() => setLoading(false)),
    [apply, fail]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reload = () => {
    setLoading(true);
    void load();
  };

  // Keep the list in sync with edits made inside the editor
  const handleEditorChange = useCallback((q: AdminQuiz | null) => {
    setQuizzes((prev) => (q ? prev.map((x) => (x.id === q.id ? q : x)) : prev));
  }, []);

  const filtered = useMemo(() => {
    const q = `${query} ${globalSearch}`.trim().toLowerCase();
    return quizzes.filter((z) => {
      if (exam !== 'All' && z.exam !== exam) return false;
      if (status === 'published' && !z.isPublished) return false;
      if (status === 'draft' && z.isPublished) return false;
      if ((status === 'live' || status === 'upcoming' || status === 'ended') && quizStatus(z) !== status) return false;
      if (q && ![z.title.mr, z.title.en, z.subject, z.exam, z.slug, z.badge ?? ''].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [quizzes, query, globalSearch, exam, status]);

  if (openId) {
    return (
      <QuizEditor
        key={openId}
        quizId={openId}
        onBack={() => {
          setOpenId(null);
          reload();
        }}
        onChanged={handleEditorChange}
        showToast={showToast}
        onUnauthorized={onUnauthorized}
      />
    );
  }

  const togglePublish = async (z: AdminQuiz) => {
    setBusyId(z.id);
    try {
      const { item } = await quizAdminApi.update(z.id, { isPublished: !z.isPublished });
      setQuizzes((prev) => prev.map((x) => (x.id === item.id ? item : x)));
      showToast(item.isPublished ? 'Quiz published.' : 'Quiz moved to drafts.', 'success');
    } catch (err) {
      fail(err, 'Publish');
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (z: AdminQuiz) => {
    setBusyId(z.id);
    try {
      const { item } = await quizAdminApi.update(z.id, { isFeatured: !z.featured });
      setQuizzes((prev) => prev.map((x) => (x.id === item.id ? item : x)));
    } catch (err) {
      fail(err, 'Update');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (z: AdminQuiz) => {
    setBusyId(z.id);
    try {
      const { item } = await quizAdminApi.duplicate(z.id);
      setQuizzes((prev) => [item, ...prev]);
      showToast(`Copy created as a draft (${item.stats.questions} questions).`, 'success');
    } catch (err) {
      fail(err, 'Duplicate');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (z: AdminQuiz) => {
    const ok = await dialog.confirm({
      title: 'Delete Quiz & All Questions?',
      message: `Are you sure you want to permanently delete "${z.title.en || z.title.mr}"?`,
      note: z.stats.attempts
        ? `Warning: ${z.stats.attempts} student attempt(s) and leaderboard rankings will also be permanently deleted.`
        : 'All configured questions and settings will be permanently removed.',
      confirmText: 'Delete Quiz',
      variant: 'danger',
    });
    if (!ok) return;

    setBusyId(z.id);
    try {
      await quizAdminApi.remove(z.id);
      setQuizzes((prev) => prev.filter((x) => x.id !== z.id));
      showToast('Quiz deleted.', 'info');
    } catch (err) {
      fail(err, 'Delete');
    } finally {
      setBusyId(null);
    }
  };

  const totals = {
    quizzes: quizzes.length,
    published: quizzes.filter((z) => z.isPublished).length,
    questions: quizzes.reduce((n, z) => n + z.stats.questions, 0),
    attempts: quizzes.reduce((n, z) => n + z.stats.attempts, 0),
    live: quizzes.filter((z) => z.isPublished && quizStatus(z) === 'live').length,
  };

  return (
    <main className="p-4 sm:p-8 space-y-5 flex-1">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E2653]">MCQ Quizzes & Mock Tests</h1>
          <p className="text-xs text-slate-500 mt-1">Create timed tests, add or import questions, schedule live tests and track student results.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} disabled={loading} className={btnSecondary} aria-label="Reload quizzes">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
          </button>
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Create with AI
          </button>
          <button onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> New quiz
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ['Quizzes', totals.quizzes, 'text-slate-900'],
          ['Published', totals.published, 'text-emerald-700'],
          ['Live now', totals.live, 'text-blue-700'],
          ['Questions', totals.questions, 'text-slate-900'],
          ['Attempts', totals.attempts, 'text-slate-900'],
        ].map(([label, value, tone]) => (
          <div key={label} className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`text-lg font-extrabold font-mono ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quizzes…" aria-label="Search quizzes" className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:border-blue-600" />
        </div>
        <select aria-label="Filter by exam" value={exam} onChange={(e) => setExam(e.target.value)} className={selectCls}>
          <option value="All">All exams</option>
          {EXAM_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="live">Open now</option>
          <option value="upcoming">Scheduled</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Quiz</th>
                <th className="py-3 px-3">Format</th>
                <th className="py-3 px-3">Schedule</th>
                <th className="py-3 px-3">Results</th>
                <th className="py-3 px-3 text-center">Published</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && !quizzes.length && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" /> Loading…
                  </td>
                </tr>
              )}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                    <p className="font-semibold text-slate-700">{quizzes.length ? 'No quizzes match these filters' : 'No quizzes yet'}</p>
                    {!quizzes.length && (
                      <button onClick={() => setCreating(true)} className={`${btnPrimary} mt-3`}>
                        Create your first quiz
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((z) => (
                <tr key={z.id} className={`hover:bg-slate-50/80 ${busyId === z.id ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4 max-w-sm">
                    <button onClick={() => setOpenId(z.id)} className="text-left cursor-pointer group">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-700 truncate">{z.title.mr || z.title.en}</p>
                      {z.title.en && z.title.en !== z.title.mr && <p className="text-[11px] text-slate-500 truncate">{z.title.en}</p>}
                      <p className="text-[10px] text-slate-400 font-mono">
                        {z.exam} • {z.subject} • /{z.slug}
                      </p>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                    <p>{z.stats.questions} Q • {z.totalMarks} marks</p>
                    <p className="text-slate-500">{z.durationMinutes} min • pass {z.passPercentage}%</p>
                    {z.stats.questions === 0 && <p className="text-amber-600 font-sans font-semibold">No questions</p>}
                  </td>
                  <td className="py-3 px-3">
                    <ScheduleBadge quiz={z} />
                    {(z.startsAt || z.endsAt) && (
                      <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                        {z.startsAt ? fmtDateTime(z.startsAt) : 'now'} → {z.endsAt ? fmtDateTime(z.endsAt) : '∞'}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                    <p>{z.stats.attempts} attempts</p>
                    <p className="text-slate-500">avg {z.stats.avgPercentage}% • pass {z.stats.passRate}%</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        role="switch"
                        aria-checked={z.isPublished}
                        aria-label={`Published: ${z.title.en || z.title.mr}`}
                        disabled={busyId === z.id || (!z.isPublished && z.stats.questions === 0)}
                        onClick={() => togglePublish(z)}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${z.isPublished ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${z.isPublished ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <PublishBadge published={z.isPublished} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button onClick={() => toggleFeatured(z)} className="p-1.5 rounded-lg hover:bg-amber-50" aria-pressed={z.featured} aria-label={`Featured: ${z.title.en || z.title.mr}`}>
                      <Star className={`w-3.5 h-3.5 ${z.featured ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                    <button onClick={() => setOpenId(z.id)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg" aria-label={`Manage ${z.title.en || z.title.mr}`} title="Questions, settings & results">
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => duplicate(z)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg" aria-label={`Duplicate ${z.title.en || z.title.mr}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(z)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label={`Delete ${z.title.en || z.title.mr}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {aiOpen && (
        <AiExtractModal
          mode="both"
          onClose={() => setAiOpen(false)}
          onUnauthorized={onUnauthorized}
          onApply={({ quiz, questions }) => {
            // Hand the suggestions to the normal create form so the admin can edit before saving
            setAiDraft({ quiz, questions });
            setAiOpen(false);
            setCreating(true);
          }}
        />
      )}

      {creating && (
        <Modal
          labelledBy="new-quiz-title"
          onClose={() => {
            setCreating(false);
            setAiDraft(null);
          }}
          title={aiDraft ? 'Review AI-filled quiz' : 'New quiz'}
          wide
        >
          {aiDraft && (
            <p className="mb-4 text-xs bg-violet-50 border border-violet-200 text-violet-900 rounded-xl px-3 py-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Filled in by AI from your document. Edit anything, then save —{' '}
              {aiDraft.questions.length} question(s) will be added automatically.
            </p>
          )}
          <QuizSettingsForm
            initial={null}
            prefill={aiDraft?.quiz ?? null}
            onCancel={() => {
              setCreating(false);
              setAiDraft(null);
            }}
            onUnauthorized={onUnauthorized}
            onSaved={async (item) => {
              const pending = aiDraft?.questions ?? [];
              setCreating(false);
              setAiDraft(null);
              setQuizzes((prev) => [item, ...prev]);
              onCountChange?.(quizzes.length + 1);
              if (pending.length) {
                try {
                  const res = await quizAdminApi.addQuestionsBulk(item.id, pending as unknown as Record<string, unknown>[]);
                  showToast(`Quiz created with ${res.inserted} question(s). Review, then publish.`, 'success');
                } catch (err) {
                  fail(err, 'Adding AI questions');
                }
              } else {
                showToast('Quiz created as a draft. Now add questions.', 'success');
              }
              setOpenId(item.id);
            }}
          />
        </Modal>
      )}
    </main>
  );
}
