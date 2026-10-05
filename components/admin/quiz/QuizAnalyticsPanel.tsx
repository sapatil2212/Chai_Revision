'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Download, Trash2, BarChart3 } from 'lucide-react';
import { quizAdminApi, type AdminQuiz, type QuizAnalytics } from '@/lib/adminQuizApi';
import { formatClock } from '@/lib/quizTypes';
import { btnSecondary, fmtDateTime, isUnauthorized, type ToastFn } from '../ui';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

interface Props {
  quiz: AdminQuiz;
  showToast: ToastFn;
  onUnauthorized: () => void;
  onReset: () => void;
}

export function QuizAnalyticsPanel({ quiz, showToast, onUnauthorized, onReset }: Props) {
  const dialog = useAdminDialog();
  const [data, setData] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      quizAdminApi
        .analytics(quiz.id)
        .then(setData)
        .catch((err) => {
          if (isUnauthorized(err)) onUnauthorized();
          else showToast(`Could not load analytics: ${(err as Error).message}`, 'error');
        })
        .finally(() => setLoading(false)),
    [quiz.id, onUnauthorized, showToast]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reload = () => {
    setLoading(true);
    void load();
  };

  const reset = async () => {
    const ok = await dialog.confirm({
      title: 'Reset All Quiz Attempts?',
      message: 'Are you sure you want to delete ALL attempts for this quiz?',
      note: 'The leaderboard and student analytics will start completely fresh. This action cannot be undone.',
      confirmText: 'Reset Attempts',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await quizAdminApi.resetAttempts(quiz.id);
      showToast(`${res.deleted} attempt(s) deleted.`, 'info');
      onReset();
      reload();
    } catch (err) {
      if (isUnauthorized(err)) onUnauthorized();
      else showToast((err as Error).message, 'error');
    }
  };

  if (loading && !data) {
    return (
      <p className="py-10 text-center text-xs text-slate-400" role="status">
        <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" /> Loading analytics…
      </p>
    );
  }
  if (!data) return null;
  const s = data.summary;
  const maxBucket = Math.max(1, ...s.distribution);
  const hardest = [...data.perQuestion].filter((q) => q.attempted > 0).sort((a, b) => a.correctRate - b.correctRate);

  const kpi = (label: string, value: string | number, tone = 'text-slate-900') => (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-lg font-extrabold font-mono ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-700" aria-hidden="true" /> Performance analytics
        </h2>
        <div className="flex gap-2">
          <button onClick={reload} className={btnSecondary} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
          </button>
          <a href={quizAdminApi.attemptsCsvUrl(quiz.id)} className={btnSecondary}>
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Attempts CSV
          </a>
          <button onClick={reset} className={`${btnSecondary} text-rose-700`} disabled={!s.attempts}>
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Reset attempts
          </button>
        </div>
      </div>

      {s.attempts === 0 ? (
        <p className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-xs text-slate-500">
          No submitted attempts yet. Analytics appear once students take this test.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {kpi('Attempts', s.attempts)}
            {kpi('Students', s.participants)}
            {kpi('Avg score', s.avgScore)}
            {kpi('Avg %', `${s.avgPercentage}%`, 'text-blue-700')}
            {kpi('Top %', `${s.highest}%`, 'text-emerald-700')}
            {kpi('Pass rate', `${s.passRate}%`, s.passRate >= 50 ? 'text-emerald-700' : 'text-amber-600')}
            {kpi('Avg time', formatClock(s.avgTimeSeconds))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="bg-white border border-slate-200 rounded-2xl p-4" aria-labelledby="dist-title">
              <h3 id="dist-title" className="text-xs font-bold text-slate-700 mb-3">Score distribution</h3>
              <div className="flex items-end gap-3 h-32">
                {s.distribution.map((n, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-500">{n}</span>
                    <div className="w-full bg-blue-500/80 rounded-t-md" style={{ height: `${(n / maxBucket) * 100}%`, minHeight: n ? 4 : 0 }} />
                    <span className="text-[10px] text-slate-400 font-mono">{i * 20}–{i * 20 + 20}%</span>
                  </div>
                ))}
              </div>
              {s.late > 0 && <p className="text-[11px] text-amber-600 mt-2">{s.late} late submission(s) are excluded from the leaderboard.</p>}
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-4" aria-labelledby="hard-title">
              <h3 id="hard-title" className="text-xs font-bold text-slate-700 mb-3">Hardest questions</h3>
              <ul className="space-y-2 text-xs">
                {hardest.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-500 w-8">Q{q.number}</span>
                    <span className="flex-1 truncate text-slate-700" title={q.question}>{q.question}</span>
                    <span className={`font-mono font-bold ${q.correctRate < 40 ? 'text-rose-600' : 'text-amber-600'}`}>{q.correctRate}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden" aria-labelledby="perq-title">
            <h3 id="perq-title" className="text-xs font-bold text-slate-700 px-4 pt-4">Question-wise analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs mt-2">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-4">#</th>
                    <th className="py-2 px-4">Question</th>
                    <th className="py-2 px-4">Correct</th>
                    <th className="py-2 px-4">Accuracy</th>
                    <th className="py-2 px-4">Skipped</th>
                    <th className="py-2 px-4">A / B / C / D picks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.perQuestion.map((q) => (
                    <tr key={q.id}>
                      <td className="py-2 px-4 font-mono text-slate-500">{q.number}</td>
                      <td className="py-2 px-4 max-w-sm truncate" title={q.question}>{q.question}</td>
                      <td className="py-2 px-4 font-mono font-bold text-emerald-700">{q.correctOption}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
                            <div className={`h-full ${q.correctRate >= 60 ? 'bg-emerald-500' : q.correctRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${q.correctRate}%` }} />
                          </div>
                          <span className="font-mono">{q.correctRate}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 font-mono text-slate-500">{q.skipRate}%</td>
                      <td className="py-2 px-4 font-mono text-[11px]">
                        {(['A', 'B', 'C', 'D'] as const).map((o) => (
                          <span key={o} className={`mr-2 ${o === q.correctOption ? 'text-emerald-700 font-bold' : o === q.commonWrong ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            {o}:{q.picks[o]}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden" aria-labelledby="recent-title">
            <h3 id="recent-title" className="text-xs font-bold text-slate-700 px-4 pt-4">Recent attempts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs mt-2">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4">Score</th>
                    <th className="py-2 px-4">%</th>
                    <th className="py-2 px-4">✓ / ✗ / –</th>
                    <th className="py-2 px-4">Time</th>
                    <th className="py-2 px-4">Result</th>
                    <th className="py-2 px-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 px-4 font-semibold text-slate-800">{a.name}</td>
                      <td className="py-2 px-4 font-mono">{a.score} / {a.totalMarks}</td>
                      <td className="py-2 px-4 font-mono">{a.percentage}%</td>
                      <td className="py-2 px-4 font-mono text-[11px]">
                        <span className="text-emerald-700">{a.correct}</span> / <span className="text-rose-600">{a.wrong}</span> / <span className="text-slate-500">{a.skipped}</span>
                      </td>
                      <td className="py-2 px-4 font-mono">{formatClock(a.timeTakenSeconds)}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {a.passed ? 'Pass' : 'Fail'}
                        </span>
                        {a.isLate && <span className="ml-1 text-[10px] text-amber-600 font-semibold">Late</span>}
                      </td>
                      <td className="py-2 px-4 text-slate-500">{fmtDateTime(a.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
