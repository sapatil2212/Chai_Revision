'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Monitor,
  Plus,
  RefreshCw,
  Smartphone,
  Tablet,
  Target,
} from 'lucide-react';
import { statsAdminApi, type ActivityItem, type DashboardStats, type UpcomingItem } from '@/lib/adminStatsApi';
import type { AdminMaterial, AdminUpdate } from '@/lib/adminApi';
import { isUnauthorized, type ToastFn } from './ui';

type Tab = 'materials' | 'quizzes' | 'pyqs' | 'updates' | 'students' | 'revenue';

interface SuperadminOverviewProps {
  showToast: ToastFn;
  onUnauthorized: () => void;
  onOpenMaterialForm: (item: AdminMaterial | null) => void;
  onOpenUpdateForm: (item: AdminUpdate | null) => void;
  onNavigateTab: (tab: Tab) => void;
}

const nf = new Intl.NumberFormat('en-IN');
const rupees = (v: number) => `₹${nf.format(v)}`;

/** "just now", "12m ago", "3h ago", "2d ago", else a short date. */
function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const whenLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Bars scaled to the largest value in the series. Flat when every value is zero. */
function Sparkline({ values, className }: { values: number[]; className: string }) {
  const max = Math.max(...values, 1);
  const empty = values.every((v) => v === 0);
  return (
    <div className="flex items-end gap-1 h-10 shrink-0 pt-1" aria-hidden="true">
      {values.map((v, i) => {
        const pct = empty ? 8 : Math.max(8, Math.round((v / max) * 100));
        const isPeak = !empty && v === max;
        return (
          <span
            key={i}
            style={{ height: `${pct}%` }}
            className={`w-2 rounded-full ${isPeak ? className : 'bg-slate-200'}`}
          />
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'emerald',
  hint,
  onClick,
  title,
  spark,
  sparkClass,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'emerald' | 'slate';
  hint: string;
  onClick: () => void;
  title: string;
  spark?: number[];
  sparkClass?: string;
}) {
  const tone =
    deltaTone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500';
  return (
    <button
      onClick={onClick}
      title={title}
      className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:shadow-sm hover:border-indigo-200 transition-all cursor-pointer group text-left w-full"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">{value}</span>
          {delta && (
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${tone}`}>
              {delta}
              {deltaTone === 'emerald' && <ArrowUpRight className="w-2.5 h-2.5" />}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</p>
      </div>
      {spark && sparkClass && <Sparkline values={spark} className={sparkClass} />}
    </button>
  );
}

const ACTIVITY_ICON: Record<ActivityItem['kind'], { icon: React.ReactNode; cls: string }> = {
  attempt: { icon: <Target className="w-4 h-4" />, cls: 'bg-indigo-50 text-indigo-600' },
  material: { icon: <BookOpen className="w-4 h-4" />, cls: 'bg-orange-50 text-orange-600' },
  update: { icon: <Bell className="w-4 h-4" />, cls: 'bg-rose-50 text-rose-600' },
  pyq: { icon: <HelpCircle className="w-4 h-4" />, cls: 'bg-amber-50 text-amber-600' },
  quiz: { icon: <ClipboardList className="w-4 h-4" />, cls: 'bg-emerald-50 text-emerald-600' },
};

const UPCOMING_ICON: Record<UpcomingItem['kind'], { icon: React.ReactNode; cls: string }> = {
  'quiz-opens': { icon: <ClipboardList className="w-4 h-4" />, cls: 'bg-[#4F46E5] text-white' },
  'quiz-closes': { icon: <CalendarClock className="w-4 h-4" />, cls: 'bg-[#FFA800] text-white' },
  'exam-date': { icon: <CalendarClock className="w-4 h-4" />, cls: 'bg-[#0088FF] text-white' },
};

/**
 * Executive overview. Every figure comes from /api/admin/stats, which reads the
 * database directly — there are no placeholder or extrapolated numbers here.
 */
export function SuperadminOverview({
  showToast,
  onUnauthorized,
  onOpenMaterialForm,
  onOpenUpdateForm,
  onNavigateTab,
}: SuperadminOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const hasStats = useRef(false);

  // Keep the last good figures on screen if a background refresh fails, but say so
  const fail = useCallback(
    (err: unknown, hadStats: boolean) => {
      if (isUnauthorized(err)) return onUnauthorized();
      if (hadStats) showToast(`Could not refresh the dashboard: ${(err as Error).message}`, 'error');
      else setError((err as Error).message);
    },
    [onUnauthorized, showToast]
  );

  const load = useCallback(
    () =>
      statsAdminApi
        .get()
        .then((s) => {
          hasStats.current = true;
          setStats(s);
          setError('');
        })
        .catch((err) => fail(err, hasStats.current)),
    [fail]
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the dashboard current while it is open
  useEffect(() => {
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  };

  if (!stats) {
    return (
      <div className="py-20 text-center" role="status" aria-live="polite">
        {error ? (
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> Could not load dashboard data: {error}
            </p>
            <button onClick={refresh} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              Try again
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading live figures…
          </p>
        )}
      </div>
    );
  }

  const { materials, pyqs, quizzes, updates, attempts, students, revenue, trend, recent, upcoming, visitors } = stats;
  const attemptSeries = trend.map((d) => d.attempts);
  const studentSeries = trend.map((d) => d.students);
  const visitorViewSeries = visitors.daily.map((d) => d.views);
  const contentTotal = materials.total + pyqs.total + quizzes.total + updates.total;
  const drafts =
    materials.drafts + (pyqs.total - pyqs.published) + (quizzes.total - quizzes.published) + (updates.total - updates.published);

  return (
    <div className="space-y-4 pb-8 font-['Poppins',sans-serif]">
      {/* Freshness + manual refresh */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">
          Live from the database · updated {relative(stats.generatedAt)}
        </p>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* ---------------- Metric cards ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Students"
          value={nf.format(students.total)}
          delta={students.activeLast7Days > 0 ? `${students.activeLast7Days} active` : undefined}
          hint={students.total === 0 ? 'No one has taken a test yet' : `active in the last ${stats.trendDays} days`}
          onClick={() => onNavigateTab('students')}
          title="Open the students directory"
          spark={studentSeries}
          sparkClass="bg-gradient-to-t from-[#00B8D9] to-[#00D7FF]"
        />

        <MetricCard
          label="Test attempts"
          value={nf.format(attempts.total)}
          delta={attempts.last7Days > 0 ? `+${attempts.last7Days}` : undefined}
          hint={
            attempts.submitted > 0
              ? `${attempts.submitted} submitted · avg ${attempts.avgPercentage}% · ${attempts.passRate}% pass`
              : 'No attempts yet'
          }
          onClick={() => onNavigateTab('quizzes')}
          title="Open the quiz manager"
          spark={attemptSeries}
          sparkClass="bg-gradient-to-t from-[#4F46E5] to-[#7C3AED]"
        />

        <MetricCard
          label="Content items"
          value={nf.format(contentTotal)}
          delta={drafts > 0 ? `${drafts} draft` : undefined}
          deltaTone="slate"
          hint={`${materials.total} materials · ${pyqs.total} PYQs · ${quizzes.total} tests · ${updates.total} circulars`}
          onClick={() => onNavigateTab('materials')}
          title="Manage study materials"
        />

        <MetricCard
          label="Revenue collected"
          value={rupees(revenue.rupees)}
          delta={revenue.live && revenue.last7DaysRupees > 0 ? `+${rupees(revenue.last7DaysRupees)}` : undefined}
          hint={revenue.live ? `${revenue.paidOrders} paid order(s)` : 'Payments not live yet'}
          onClick={() => onNavigateTab('revenue')}
          title="Open the revenue ledger"
        />
      </div>

      {/* ---------------- Visitor Analytics Section ---------------- */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Website Traffic</h3>
              <p className="text-[10px] text-slate-400">Last {stats.trendDays} days analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Today: <span className="font-bold text-slate-700">{nf.format(visitors.todayViews)} views</span>
              <span className="mx-1">·</span>
              <span className="font-bold text-slate-700">{nf.format(visitors.todayVisitors)} visitors</span>
            </span>
          </div>
        </div>

        {/* Headline metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Page Views', value: nf.format(visitors.totalViews), hint: 'All time' },
            { label: 'Unique Visitors', value: nf.format(visitors.uniqueVisitors), hint: 'All time' },
            { label: 'Views (7d)', value: nf.format(visitors.last7DaysViews), hint: `Last ${stats.trendDays} days` },
            {
              label: 'Avg per day',
              value: nf.format(Math.round(visitors.last7DaysViews / stats.trendDays)),
              hint: 'Page views',
            },
          ].map((m) => (
            <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-left">
              <p className="text-[10px] font-medium text-slate-400">{m.label}</p>
              <p className="text-base font-black text-slate-900 font-mono mt-0.5">{m.value}</p>
              <p className="text-[9px] text-slate-400">{m.hint}</p>
            </div>
          ))}
        </div>

        {/* Daily traffic chart */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-2">Daily Traffic</p>
          <div className="flex items-end gap-1.5 h-24" aria-label="Daily page views chart">
            {visitors.daily.map((d, i) => {
              const maxViews = Math.max(...visitorViewSeries, 1);
              const pct = visitors.totalViews === 0 ? 6 : Math.max(6, Math.round((d.views / maxViews) * 100));
              const isToday = i === visitors.daily.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-slate-400 font-mono">{d.views || ''}</span>
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full rounded-md transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-violet-500 to-violet-400'
                        : 'bg-gradient-to-t from-slate-200 to-slate-150 hover:from-violet-200 hover:to-violet-100'
                    }`}
                    title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}
                  />
                  <span className="text-[8px] text-slate-400 font-mono">
                    {new Date(d.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom grid: Top Pages | Devices + Browsers | Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Pages */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500">Top Pages</p>
            {visitors.topPages.length === 0 ? (
              <p className="text-[10px] text-slate-400 py-4 text-center">No page views recorded yet</p>
            ) : (
              <ul className="space-y-1">
                {visitors.topPages.map((pg) => {
                  const maxPg = visitors.topPages[0]?.views || 1;
                  return (
                    <li key={pg.path} className="flex items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="relative h-6 flex items-center">
                          <div
                            className="absolute inset-y-0 left-0 bg-violet-50 rounded-md group-hover:bg-violet-100 transition-colors"
                            style={{ width: `${Math.max(8, (pg.views / maxPg) * 100)}%` }}
                          />
                          <span className="relative text-[10px] font-medium text-slate-700 pl-2 truncate">
                            {pg.path}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 font-mono shrink-0">{pg.views}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Devices + Browser + OS */}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Devices</p>
              {visitors.devices.length === 0 ? (
                <p className="text-[10px] text-slate-400">No data</p>
              ) : (
                <div className="space-y-1">
                  {visitors.devices.map((d) => {
                    const total = visitors.devices.reduce((s, x) => s + x.count, 0) || 1;
                    const pct = Math.round((d.count / total) * 100);
                    const DevIcon = d.type === 'mobile' ? Smartphone : d.type === 'tablet' ? Tablet : Monitor;
                    return (
                      <div key={d.type} className="flex items-center gap-2">
                        <DevIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] text-slate-600 w-14 capitalize">{d.type}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Browsers</p>
              {visitors.browsers.length === 0 ? (
                <p className="text-[10px] text-slate-400">No data</p>
              ) : (
                <div className="space-y-1">
                  {visitors.browsers.slice(0, 5).map((b) => {
                    const total = visitors.browsers.reduce((s, x) => s + x.count, 0) || 1;
                    const pct = Math.round((b.count / total) * 100);
                    return (
                      <div key={b.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 w-14 truncate">{b.name}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Operating Systems</p>
              {visitors.operatingSystems.length === 0 ? (
                <p className="text-[10px] text-slate-400">No data</p>
              ) : (
                <div className="space-y-1">
                  {visitors.operatingSystems.slice(0, 5).map((o) => {
                    const total = visitors.operatingSystems.reduce((s, x) => s + x.count, 0) || 1;
                    const pct = Math.round((o.count / total) * 100);
                    return (
                      <div key={o.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 w-14 truncate">{o.name}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500">Traffic Sources</p>
            {visitors.referrers.length === 0 ? (
              <p className="text-[10px] text-slate-400 py-4 text-center">No referrer data yet</p>
            ) : (
              <ul className="space-y-1">
                {visitors.referrers.map((r) => {
                  const maxRef = visitors.referrers[0]?.count || 1;
                  const label = r.source === 'Direct' ? 'Direct / Bookmark' : (() => {
                    try { return new URL(r.source).hostname; } catch { return r.source; }
                  })();
                  return (
                    <li key={r.source} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="relative h-6 flex items-center">
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-50 rounded-md"
                            style={{ width: `${Math.max(8, (r.count / maxRef) * 100)}%` }}
                          />
                          <span className="relative text-[10px] font-medium text-slate-700 pl-2 truncate">
                            {label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 font-mono shrink-0">{r.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Secondary real figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Download className="w-3.5 h-3.5" />,
            label: 'Free PDF downloads',
            value: nf.format(materials.downloads),
            note: `${materials.free} free · ${materials.withFile} with a PDF`,
            tab: 'materials' as Tab,
          },
          {
            icon: <HelpCircle className="w-3.5 h-3.5" />,
            label: 'PYQ bank',
            value: nf.format(pyqs.published),
            note: `${pyqs.years} year(s) covered`,
            tab: 'pyqs' as Tab,
          },
          {
            icon: <ClipboardList className="w-3.5 h-3.5" />,
            label: 'Quiz questions',
            value: nf.format(quizzes.questions),
            note: `${quizzes.published} of ${quizzes.total} tests published`,
            tab: 'quizzes' as Tab,
          },
          {
            icon: <Bell className="w-3.5 h-3.5" />,
            label: 'Circulars live',
            value: nf.format(updates.published),
            note: `${updates.total} total`,
            tab: 'updates' as Tab,
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigateTab(s.tab)}
            className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-left hover:border-indigo-200 transition-colors cursor-pointer"
          >
            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-400">{s.icon}</span>
              {s.label}
            </p>
            <p className="text-sm font-black text-slate-900 font-mono mt-1">{s.value}</p>
            <p className="text-[10px] text-slate-400 truncate">{s.note}</p>
          </button>
        ))}
      </div>

      {/* ---------------- Activity + upcoming ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Recent activity */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              View students
            </button>
          </div>

          {recent.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-8 text-center">
              Nothing has happened yet. Activity appears here as soon as content is added or a student takes a test.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((a, i) => {
                const look = ACTIVITY_ICON[a.kind];
                return (
                  <li
                    key={`${a.kind}-${a.at}-${i}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${look.cls}`}>
                        {look.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{a.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {a.value && <span className="text-xs font-bold text-slate-900 font-mono block">{a.value}</span>}
                      <span className="text-[9px] text-slate-400 font-mono">{relative(a.at)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Upcoming + quick actions */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Coming up</h3>
              <button
                onClick={() => onNavigateTab('updates')}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Circulars
              </button>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-6 text-center">
                No scheduled tests or exam dates ahead.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((u, i) => {
                  const look = UPCOMING_ICON[u.kind];
                  return (
                    <li
                      key={`${u.kind}-${i}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${look.cls}`}>
                          {look.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-slate-600">{u.label}</span>
                        <p className="text-[9px] text-slate-400 font-mono">{u.at ? whenLabel(u.at) : '—'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!revenue.live && (
            <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 flex items-start gap-1.5">
              <CreditCard className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" aria-hidden="true" />
              No payment gateway is connected yet, so revenue reads ₹0. Free downloads and test attempts are counted above.
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => onOpenMaterialForm(null)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#5D4FE6] hover:bg-[#4E44CE] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Material</span>
            </button>
            <button
              onClick={() => onOpenUpdateForm(null)}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Post Notice
            </button>
            <button
              onClick={() => onNavigateTab('pyqs')}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
              title="Import a previous-year paper"
            >
              PYQs <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      {/* Nudge when there is content but nothing published */}
      {contentTotal > 0 && materials.withFile === 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          No study material has a PDF uploaded yet, so students cannot download anything.
          <button onClick={() => onNavigateTab('materials')} className="font-bold underline cursor-pointer">
            Upload one
          </button>
        </p>
      )}
    </div>
  );
}
