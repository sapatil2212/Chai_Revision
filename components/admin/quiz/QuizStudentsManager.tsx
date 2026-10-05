'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { studentsAdminApi, type QuizStudent, type StudentAttempt, type StudentSort, type StudentsPage } from '@/lib/adminStudentsApi';
import { Modal, btnPrimary, btnSecondary, fmtDateTime, isUnauthorized, type ToastFn } from '../ui';

interface Props {
  globalSearch: string;
  showToast: ToastFn;
  onUnauthorized: () => void;
  /** Reports the total number of students so the sidebar badge can show it. */
  onCountChange?: (n: number) => void;
}

const PAGE_SIZE = 25;

const selectCls = 'bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600';

const SORTS: { value: StudentSort; label: string }[] = [
  { value: 'recent', label: 'Most recent attempt' },
  { value: 'attempts', label: 'Most attempts' },
  { value: 'best', label: 'Best score' },
  { value: 'name', label: 'Name (A–Z)' },
];

const pct = (n: number) => `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`;

const mins = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-[#1E2653] font-mono mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function StatusPill({ a }: { a: StudentAttempt }) {
  if (a.status === 'in_progress')
    return <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-200">In progress</span>;
  return a.passed ? (
    <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">Passed</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-rose-50 text-rose-700 border-rose-200">Not passed</span>
  );
}

function StudentDetail({
  student,
  attempts,
  loading,
  onClose,
}: {
  student: QuizStudent | null;
  attempts: StudentAttempt[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      title={
        <>
          <Users className="w-4 h-4 text-blue-700" aria-hidden="true" />
          <span>{student ? student.name : 'Student'}</span>
        </>
      }
      onClose={onClose}
      wide
      labelledBy="student-detail-title"
    >
      {loading || !student ? (
        <p className="text-xs text-slate-500 py-8 text-center flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading attempt history…
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mobile</span>
                <p className="font-mono font-semibold text-slate-900">{student.mobile || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                <p className="font-mono text-slate-900 break-all">{student.email || <span className="text-slate-400">not provided</span>}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Address</span>
                <p className="font-semibold text-slate-800">{student.address || '—'}</p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              ['Attempts', student.attempts],
              ['Tests taken', student.tests],
              ['Best score', pct(student.bestPercentage)],
              ['Average', pct(student.avgPercentage)],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-white border border-slate-200 rounded-2xl p-3">
                <dt className="text-[10px] uppercase font-bold text-slate-400">{k}</dt>
                <dd className="text-sm font-extrabold text-slate-900 font-mono">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" /> First attempt: {fmtDateTime(student.firstSeenAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Last attempt: {fmtDateTime(student.lastSeenAt)}
            </span>
          </p>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">Attempt history ({attempts.length})</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Test</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">C / W / S</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Started</th>
                      <th className="py-2.5 px-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">{a.quizTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono">#{a.id}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusPill a={a} />
                          {a.isLate && <span className="ml-1 text-[10px] text-amber-700 font-semibold">late</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {a.status === 'submitted' ? `${a.score}/${a.totalMarks}` : '—'}
                          {a.status === 'submitted' && <span className="block text-[10px] font-normal text-slate-400">{pct(a.percentage)}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {a.correct} / {a.wrong} / {a.skipped}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{a.status === 'submitted' ? mins(a.timeTakenSeconds) : '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{fmtDateTime(a.startedAt)}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{fmtDateTime(a.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Students who have taken an MCQ test, built from the details they fill in before
 * every attempt. Rows are grouped by mobile number, so one person appears once.
 */
export function QuizStudentsManager({ globalSearch, showToast, onUnauthorized, onCountChange }: Props) {
  const [page, setPage] = useState<StudentsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // debounced value actually sent to the server
  const [sort, setSort] = useState<StudentSort>('recent');
  const [offset, setOffset] = useState(0);

  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ student: QuizStudent; attempts: StudentAttempt[] } | null>(null);

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

  const load = useCallback(
    () =>
      studentsAdminApi
        .list({ search, sort, limit: PAGE_SIZE, offset })
        .then((p) => {
          setPage(p);
          onCountChange?.(p.summary.students);
        })
        .catch((err) => fail(err, 'Loading students'))
        .finally(() => setLoading(false)),
    [search, sort, offset, fail, onCountChange]
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Attempt history is fetched on demand when a row is opened
  useEffect(() => {
    if (!detailKey) return;
    let alive = true;
    studentsAdminApi
      .get(detailKey)
      .then((d) => alive && setDetail(d))
      .catch((err) => {
        if (!alive) return;
        setDetailKey(null);
        fail(err, 'Loading student');
      });
    return () => {
      alive = false;
    };
  }, [detailKey, fail]);

  const openDetail = (key: string) => {
    setDetail(null);
    setDetailKey(key);
  };

  const reload = () => {
    setLoading(true);
    void load();
  };

  const s = page?.summary;
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const from = total ? offset + 1 : 0;
  const to = Math.min(offset + PAGE_SIZE, total);

  return (
    <main className="p-4 sm:p-8 space-y-6 flex-1">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E2653]">Students Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every aspirant who filled in their details before an MCQ test, with full attempt history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reload} className={btnSecondary} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <a href={studentsAdminApi.csvUrl(search)} className={btnPrimary} download>
            <Download className="w-4 h-4" aria-hidden="true" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Students" value={s?.students ?? '—'} hint={s ? `${s.withEmail} shared an email` : undefined} />
        <StatCard label="Attempts" value={s?.attempts ?? '—'} hint={s ? `${s.submitted} submitted` : undefined} />
        <StatCard label="In progress" value={s?.inProgress ?? '—'} hint="Started, not submitted" />
        <StatCard label="Average score" value={s ? pct(s.avgPercentage) : '—'} hint="Across submitted attempts" />
        <StatCard label="New this week" value={s?.newLast7Days ?? '—'} hint={s ? `${s.activeLast7Days} active in 7 days` : undefined} />
      </div>

      {s?.truncated && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Showing the most recent 20,000 attempts. Older attempts are excluded from this directory.
        </p>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, mobile, email or address…"
              aria-label="Search students"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as StudentSort);
              setOffset(0);
            }}
            aria-label="Sort students"
            className={selectCls}
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Best / Avg</th>
                <th className="py-3 px-4">Last test</th>
                <th className="py-3 px-4">Last attempt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && !items.length && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" /> Loading students…
                  </td>
                </tr>
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-6 h-6 mx-auto mb-2 text-slate-300" aria-hidden="true" />
                    {search ? 'No student matches this search.' : 'No one has taken an MCQ test yet. Details appear here as soon as the first student starts a test.'}
                  </td>
                </tr>
              )}
              {items.map((st) => (
                <tr key={st.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{st.name}</p>
                    <p className="text-[10px] text-slate-400">First seen {fmtDateTime(st.firstSeenAt)}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-semibold text-slate-800">{st.mobile || '—'}</p>
                    {st.email ? (
                      <p className="text-[10px] text-slate-400 font-mono break-all">{st.email}</p>
                    ) : (
                      <p className="text-[10px] text-slate-300">no email</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[16rem]">
                    <span className="line-clamp-2">{st.address || '—'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    <span className="font-bold">{st.attempts}</span>
                    <span className="block text-[10px] text-slate-400">
                      {st.tests} test{st.tests === 1 ? '' : 's'}
                      {st.inProgress ? ` • ${st.inProgress} open` : ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-emerald-700">{pct(st.bestPercentage)}</span>
                    <span className="block text-[10px] text-slate-400">avg {pct(st.avgPercentage)}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[14rem]">
                    <span className="line-clamp-2">{st.lastQuizTitle}</span>
                    {st.passed > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {st.passed} passed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{fmtDateTime(st.lastSeenAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openDetail(st.key)}
                      className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer font-semibold"
                    >
                      View history
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
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0 || loading}
                className={btnSecondary}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Previous
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={to >= total || loading}
                className={btnSecondary}
              >
                Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailKey && (
        <StudentDetail
          student={detail?.student ?? null}
          attempts={detail?.attempts ?? []}
          loading={!detail}
          onClose={() => {
            setDetailKey(null);
            setDetail(null);
          }}
        />
      )}
    </main>
  );
}
