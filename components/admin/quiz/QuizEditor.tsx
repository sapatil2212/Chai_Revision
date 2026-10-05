'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  FileSpreadsheet,
  Download,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { AiExtractModal } from './AiExtractModal';
import { quizAdminApi, type AdminQuestion, type AdminQuiz } from '@/lib/adminQuizApi';
import { formatClock } from '@/lib/quizTypes';
import { QuestionFormModal } from './QuestionFormModal';
import { CsvImportModal } from './CsvImportModal';
import { QuizSettingsForm } from './QuizSettingsForm';
import { QuizAnalyticsPanel } from './QuizAnalyticsPanel';
import { Modal, PublishBadge, ScheduleBadge, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls, type ToastFn } from '../ui';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

interface Props {
  quizId: string;
  onBack: () => void;
  onChanged: (quiz: AdminQuiz | null) => void; // null = deleted
  showToast: ToastFn;
  onUnauthorized: () => void;
}

type Tab = 'questions' | 'settings' | 'analytics';

export function QuizEditor({ quizId, onBack, onChanged, showToast, onUnauthorized }: Props) {
  const dialog = useAdminDialog();
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('questions');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<AdminQuestion | null | 'new'>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const fail = useCallback(
    (err: unknown, action: string) => {
      if (isUnauthorized(err)) return onUnauthorized();
      showToast(`${action} failed: ${(err as Error).message}`, 'error');
    },
    [onUnauthorized, showToast]
  );

  const apply = useCallback(
    (res: { quiz: AdminQuiz; questions: AdminQuestion[] }) => {
      setQuiz(res.quiz);
      setQuestions(res.questions);
      onChanged(res.quiz);
    },
    [onChanged]
  );

  /** (Re-)fetch quiz + questions; also refreshes totals after question changes. */
  const refreshQuiz = useCallback(
    () =>
      quizAdminApi
        .get(quizId)
        .then(apply)
        .catch((err) => fail(err, 'Loading quiz'))
        .finally(() => setLoading(false)),
    [quizId, apply, fail]
  );

  useEffect(() => {
    void refreshQuiz();
  }, [refreshQuiz]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) =>
      [x.question.mr, x.question.en, x.topic, ...x.options.flatMap((o) => [o.text.mr, o.text.en])].join(' ').toLowerCase().includes(q)
    );
  }, [questions, filter]);

  if (loading && !quiz) {
    return (
      <main className="p-8 flex-1 text-center text-xs text-slate-400" role="status">
        <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" /> Loading quiz…
      </main>
    );
  }
  if (!quiz) return null;

  // ---------------- actions ----------------
  const togglePublish = async () => {
    setBusy(true);
    try {
      const { item } = await quizAdminApi.update(quiz.id, { isPublished: !quiz.isPublished });
      setQuiz(item);
      onChanged(item);
      showToast(item.isPublished ? 'Quiz published — students can see it now.' : 'Quiz moved to drafts.', 'success');
    } catch (err) {
      fail(err, 'Publishing');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[index], next[j]] = [next[j], next[index]];
    setQuestions(next.map((q, i) => ({ ...q, position: i })));
    try {
      await quizAdminApi.reorder(quiz.id, next.map((q) => q.id));
    } catch (err) {
      fail(err, 'Reorder');
      void refreshQuiz();
    }
  };

  const duplicateQ = async (q: AdminQuestion) => {
    try {
      await quizAdminApi.duplicateQuestion(quiz.id, q.id);
      await refreshQuiz();
      showToast('Question duplicated.', 'success');
    } catch (err) {
      fail(err, 'Duplicate');
    }
  };

  const deleteQ = async (q: AdminQuestion) => {
    const snippet = q.question?.en || q.question?.mr;
    const ok = await dialog.confirm({
      title: `Delete Question #${q.position + 1}?`,
      message: snippet ? `"${snippet.length > 80 ? snippet.slice(0, 80) + '…' : snippet}"` : `Delete question #${q.position + 1}?`,
      note: 'Question numbers will automatically adjust.',
      confirmText: 'Delete Question',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await quizAdminApi.deleteQuestion(quiz.id, q.id);
      await refreshQuiz();
      showToast(res.unpublished ? 'Last question deleted — quiz moved to drafts.' : 'Question deleted.', 'info');
    } catch (err) {
      fail(err, 'Delete');
    }
  };

  const deleteQuiz = async () => {
    const ok = await dialog.confirm({
      title: 'Delete Quiz & All Questions?',
      message: `Are you sure you want to permanently delete "${quiz.title.en || quiz.title.mr}"?`,
      note: quiz.stats.attempts
        ? `Warning: ${quiz.stats.attempts} student attempt(s) and leaderboard rankings will also be permanently deleted.`
        : 'All questions, options, and quiz settings will be destroyed.',
      confirmText: 'Delete Quiz',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await quizAdminApi.remove(quiz.id);
      showToast('Quiz deleted.', 'info');
      onChanged(null);
      onBack();
    } catch (err) {
      fail(err, 'Delete quiz');
    }
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${tab === id ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
    >
      {label}
    </button>
  );

  return (
    <main className="p-4 sm:p-8 space-y-5 flex-1">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Back to all quizzes">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <PublishBadge published={quiz.isPublished} />
                <ScheduleBadge quiz={quiz} />
                {quiz.featured && <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-200">★ Featured</span>}
              </div>
              <h1 className="text-lg font-bold text-[#1E2653] truncate">{quiz.title.mr || quiz.title.en}</h1>
              <p className="text-xs text-slate-500">
                {quiz.exam} • {quiz.subject} • {quiz.stats.questions} questions • {quiz.totalMarks} marks • {quiz.durationMinutes} min
                {quiz.negativeLabel ? ` • ${quiz.negativeLabel}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quiz.isPublished && (
              <a href={`/#quiz/${quiz.slug}`} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> View on site
              </a>
            )}
            <button onClick={togglePublish} disabled={busy || (!quiz.isPublished && quiz.stats.questions === 0)} className={quiz.isPublished ? btnSecondary : btnPrimary} title={quiz.stats.questions === 0 ? 'Add questions first' : undefined}>
              {quiz.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={deleteQuiz} className={`${btnSecondary} text-rose-700`}>
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          {[
            ['Questions', quiz.stats.questions],
            ['Attempts', quiz.stats.attempts],
            ['Students', quiz.stats.participants],
            ['Avg score', `${quiz.stats.avgPercentage}%`],
            ['Pass rate', `${quiz.stats.passRate}%`],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-50 rounded-xl py-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
              <p className="text-sm font-extrabold font-mono text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit" role="tablist" aria-label="Quiz sections">
          {tabBtn('questions', `Questions (${quiz.stats.questions})`)}
          {tabBtn('settings', 'Settings')}
          {tabBtn('analytics', 'Results & analytics')}
        </div>
      </div>

      {/* Questions */}
      {tab === 'questions' && (
        <section className="space-y-3" aria-label="Questions">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search questions…" aria-label="Search questions" className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:border-blue-600" />
            </div>
            <button onClick={() => setMarksOpen(true)} className={btnSecondary} disabled={!questions.length}>
              Apply marks to all
            </button>
            <a href={quizAdminApi.exportUrl(quiz.id)} className={btnSecondary} aria-disabled={!questions.length}>
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
            </a>
            <button onClick={() => setImportOpen(true)} className={btnSecondary}>
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" /> Import CSV
            </button>
            <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Extract with AI
            </button>
            <button onClick={() => setEditing('new')} className={btnPrimary}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700">No questions yet</p>
              <p className="text-xs text-slate-500">Add questions one by one, or import many at once from a CSV/Excel sheet.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Extract with AI
                </button>
                <button onClick={() => setImportOpen(true)} className={btnSecondary}>
                  <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" /> Import CSV
                </button>
                <button onClick={() => setEditing('new')} className={btnPrimary}>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add first question
                </button>
              </div>
            </div>
          ) : (
            <ol className="space-y-2">
              {visible.map((q) => {
                const index = questions.findIndex((x) => x.id === q.id);
                return (
                  <li key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold text-xs flex items-center justify-center">{index + 1}</span>
                      <button onClick={() => move(index, -1)} disabled={index === 0 || !!filter} className="p-0.5 text-slate-400 hover:text-blue-700 disabled:opacity-30" aria-label={`Move question ${index + 1} up`}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(index, 1)} disabled={index === questions.length - 1 || !!filter} className="p-0.5 text-slate-400 hover:text-blue-700 disabled:opacity-30" aria-label={`Move question ${index + 1} down`}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{q.question.mr || q.question.en}</p>
                      {q.question.en && q.question.en !== q.question.mr && <p className="text-xs text-slate-500">{q.question.en}</p>}
                      <ul className="grid sm:grid-cols-2 gap-1.5 text-xs">
                        {q.options.map((o) => (
                          <li key={o.id} className={`px-2.5 py-1.5 rounded-lg border ${o.id === q.correctOption ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 text-slate-600'}`}>
                            <span className="font-mono mr-1.5">{o.id}.</span>
                            {o.text.mr || o.text.en}
                            {o.id === q.correctOption && <span className="sr-only"> (correct answer)</span>}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span className="text-emerald-700">+{q.marks}</span>
                        {q.negativeMarks > 0 && <span className="text-rose-600">−{q.negativeMarks}</span>}
                        <span>{q.difficulty}</span>
                        <span>• {q.topic}</span>
                        {q.image && <span className="inline-flex items-center gap-0.5"><ImageIcon className="w-3 h-3" aria-hidden="true" /> image</span>}
                        {!(q.explanation.mr || q.explanation.en) && <span className="text-amber-600">• no explanation</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => setEditing(q)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg" aria-label={`Edit question ${index + 1}`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => duplicateQ(q)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg" aria-label={`Duplicate question ${index + 1}`}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteQ(q)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label={`Delete question ${index + 1}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {questions.length > 0 && (
            <p className="text-[11px] text-slate-400 font-mono">
              Total {quiz.totalMarks} marks • suggested time ≈ {formatClock(questions.length * 36)} at 36 s/question
            </p>
          )}
        </section>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6" aria-label="Quiz settings">
          <QuizSettingsForm
            key={quiz.updatedAt}
            initial={quiz}
            onUnauthorized={onUnauthorized}
            onSaved={(item) => {
              setQuiz(item);
              onChanged(item);
              showToast('Settings saved.', 'success');
            }}
          />
        </section>
      )}

      {/* Analytics */}
      {tab === 'analytics' && <QuizAnalyticsPanel quiz={quiz} showToast={showToast} onUnauthorized={onUnauthorized} onReset={refreshQuiz} />}

      {/* Modals */}
      {editing && (
        <QuestionFormModal
          quiz={quiz}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onUnauthorized={onUnauthorized}
          onSaved={(_q, mode, keepOpen) => {
            void refreshQuiz();
            showToast(mode === 'created' ? 'Question added.' : 'Question updated.', 'success');
            if (!keepOpen) setEditing(null);
          }}
        />
      )}
      {aiOpen && (
        <AiExtractModal
          mode="questions"
          defaults={{ marks: quiz.defaultMarks, negativeMarks: quiz.defaultNegativeMarks }}
          onClose={() => setAiOpen(false)}
          onUnauthorized={onUnauthorized}
          onApply={async ({ questions }) => {
            const res = await quizAdminApi.addQuestionsBulk(quiz.id, questions as unknown as Record<string, unknown>[]);
            setAiOpen(false);
            await refreshQuiz();
            showToast(`${res.inserted} question(s) added from your document.`, 'success');
          }}
        />
      )}
      {importOpen && (
        <CsvImportModal
          quiz={quiz}
          onClose={() => setImportOpen(false)}
          onUnauthorized={onUnauthorized}
          onImported={(n) => {
            setImportOpen(false);
            void refreshQuiz();
            showToast(`${n} question(s) imported.`, 'success');
          }}
        />
      )}
      {marksOpen && (
        <ApplyMarksModal
          quiz={quiz}
          onClose={() => setMarksOpen(false)}
          onDone={(n) => {
            setMarksOpen(false);
            void refreshQuiz();
            showToast(`Marks updated on ${n} question(s).`, 'success');
          }}
          onError={(err) => fail(err, 'Apply marks')}
        />
      )}
    </main>
  );
}

function ApplyMarksModal({
  quiz,
  onClose,
  onDone,
  onError,
}: {
  quiz: AdminQuiz;
  onClose: () => void;
  onDone: (n: number) => void;
  onError: (err: unknown) => void;
}) {
  const [marks, setMarks] = useState(String(quiz.defaultMarks));
  const [neg, setNeg] = useState(String(quiz.defaultNegativeMarks));
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onDone((await quizAdminApi.applyMarks(quiz.id, Number(marks), Number(neg))).updated);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal labelledBy="apply-marks-title" onClose={onClose} title="Apply marks to all questions">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-slate-600">Sets the same marks on all {quiz.stats.questions} questions and saves them as this quiz&apos;s defaults.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="am-marks" className={labelCls}>Marks per correct answer</label>
            <input id="am-marks" type="number" min={0.25} step={0.25} value={marks} onChange={(e) => setMarks(e.target.value)} className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label htmlFor="am-neg" className={labelCls}>Negative per wrong answer</label>
            <input id="am-neg" type="number" min={0} step={0.25} value={neg} onChange={(e) => setNeg(e.target.value)} className={`${inputCls} font-mono`} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>Apply</button>
        </div>
      </form>
    </Modal>
  );
}
