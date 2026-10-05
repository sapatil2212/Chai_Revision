// Real numbers for the superadmin dashboard, aggregated straight from the database.
// Nothing here is estimated or extrapolated: if a figure is zero, it is zero.
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';

const M = schema.materials;
const P = schema.pyqs;
const QS = schema.quizSets;
const QQ = schema.quizQuestions;
const QA = schema.quizAttempts;
const U = schema.examUpdates;
const O = schema.orders;
const D = schema.importantDates;
const PV = schema.pageViews;

const TREND_DAYS = 7;
const n = (v: unknown) => Number(v ?? 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

/** Local-date key (YYYY-MM-DD) for a Date or a MySQL DATE string. */
const dayKey = (v: unknown) => {
  if (v instanceof Date) {
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  return String(v).slice(0, 10);
};

export type ActivityKind = 'attempt' | 'material' | 'update' | 'pyq' | 'quiz';

export interface ActivityItem {
  kind: ActivityKind;
  title: string;
  subtitle: string;
  /** ISO timestamp this happened. */
  at: string;
  /** Right-aligned value, e.g. a score. */
  value?: string;
}

export interface UpcomingItem {
  kind: 'quiz-opens' | 'quiz-closes' | 'exam-date';
  title: string;
  subtitle: string;
  /** ISO timestamp, or null when the source only has a display label. */
  at: string | null;
  label: string;
}

const l2 = (v: { mr?: string; en?: string } | null | undefined) => v?.mr || v?.en || '';

// -------------------------------------------------------------------------
// Sections
// -------------------------------------------------------------------------

async function contentStats() {
  const [[mats], [pyq], [quiz], [{ questions }], [upd]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when ${M.isPublished} then 1 else 0 end)`,
        free: sql<number>`sum(case when ${M.isFree} then 1 else 0 end)`,
        withFile: sql<number>`sum(case when ${M.fileUrl} is not null then 1 else 0 end)`,
        downloads: sql<number>`coalesce(sum(${M.downloadCount}), 0)`,
      })
      .from(M),
    db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when ${P.isPublished} then 1 else 0 end)`,
        years: sql<number>`count(distinct ${P.year})`,
      })
      .from(P),
    db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when ${QS.isPublished} then 1 else 0 end)`,
      })
      .from(QS),
    db.select({ questions: sql<number>`count(*)` }).from(QQ),
    db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when ${U.isPublished} then 1 else 0 end)`,
      })
      .from(U),
  ]);

  return {
    materials: {
      total: n(mats?.total),
      published: n(mats?.published),
      drafts: n(mats?.total) - n(mats?.published),
      free: n(mats?.free),
      withFile: n(mats?.withFile),
      downloads: n(mats?.downloads),
    },
    pyqs: { total: n(pyq?.total), published: n(pyq?.published), years: n(pyq?.years) },
    quizzes: { total: n(quiz?.total), published: n(quiz?.published), questions: n(questions) },
    updates: { total: n(upd?.total), published: n(upd?.published) },
  };
}

async function engagementStats(since: Date) {
  const [[all], [recent], [students], [newStudents]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        submitted: sql<number>`sum(case when ${QA.status} = 'submitted' then 1 else 0 end)`,
        avgPct: sql<number>`avg(case when ${QA.status} = 'submitted' then ${QA.percentage} end)`,
        passed: sql<number>`sum(case when ${QA.status} = 'submitted' and ${QA.passed} then 1 else 0 end)`,
      })
      .from(QA),
    db.select({ attempts: sql<number>`count(*)` }).from(QA).where(gte(QA.startedAt, since)),
    db
      .select({ total: sql<number>`count(distinct coalesce(${QA.participantMobile}, ${QA.participantId}))` })
      .from(QA),
    db
      .select({ total: sql<number>`count(distinct coalesce(${QA.participantMobile}, ${QA.participantId}))` })
      .from(QA)
      .where(gte(QA.startedAt, since)),
  ]);

  const submitted = n(all?.submitted);
  return {
    attempts: {
      total: n(all?.total),
      submitted,
      inProgress: n(all?.total) - submitted,
      last7Days: n(recent?.attempts),
      avgPercentage: submitted ? round2(n(all?.avgPct)) : 0,
      passRate: submitted ? round2((n(all?.passed) / submitted) * 100) : 0,
    },
    students: { total: n(students?.total), activeLast7Days: n(newStudents?.total) },
  };
}

/**
 * Revenue from completed orders. The payment gateway is not wired up yet, so this is
 * genuinely zero — `live` tells the UI to say so instead of showing an invented figure.
 */
async function revenueStats(since: Date) {
  const [[all], [recent]] = await Promise.all([
    db
      .select({
        orders: sql<number>`count(*)`,
        paid: sql<number>`sum(case when ${O.status} = 'Completed' then 1 else 0 end)`,
        rupees: sql<number>`coalesce(sum(case when ${O.status} = 'Completed' then ${O.totalAmount} else 0 end), 0)`,
      })
      .from(O),
    db
      .select({ rupees: sql<number>`coalesce(sum(${O.totalAmount}), 0)` })
      .from(O)
      .where(and(eq(O.status, 'Completed'), gte(O.paidAt, since))),
  ]);

  const orders = n(all?.orders);
  return {
    orders,
    paidOrders: n(all?.paid),
    rupees: n(all?.rupees),
    last7DaysRupees: n(recent?.rupees),
    /** False until the first order exists, i.e. payments are not live yet. */
    live: orders > 0,
  };
}

/** Attempts and active students per day for the last 7 days, zero-filled. */
async function trend(since: Date) {
  const rows = await db
    .select({
      day: sql<string>`date(${QA.startedAt})`,
      attempts: sql<number>`count(*)`,
      students: sql<number>`count(distinct coalesce(${QA.participantMobile}, ${QA.participantId}))`,
    })
    .from(QA)
    .where(gte(QA.startedAt, since))
    .groupBy(sql`date(${QA.startedAt})`);

  const byDay = new Map(rows.map((r) => [dayKey(r.day), r]));
  const out: { date: string; attempts: number; students: number }[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const hit = byDay.get(key);
    out.push({ date: key, attempts: n(hit?.attempts), students: n(hit?.students) });
  }
  return out;
}

/** Newest real events across the platform, merged into one feed. */
async function recentActivity(): Promise<ActivityItem[]> {
  const [attempts, mats, upds, pyqs, quizzes] = await Promise.all([
    db
      .select({
        name: QA.participantName,
        pct: QA.percentage,
        passed: QA.passed,
        completedAt: QA.completedAt,
        title: QS.title,
      })
      .from(QA)
      .innerJoin(QS, eq(QS.id, QA.quizSetId))
      .where(eq(QA.status, 'submitted'))
      .orderBy(desc(QA.completedAt))
      .limit(6),
    db.select({ title: M.title, exam: M.exam, at: M.createdAt, isFree: M.isFree }).from(M).orderBy(desc(M.createdAt)).limit(4),
    db.select({ title: U.title, exam: U.exam, at: U.createdAt }).from(U).orderBy(desc(U.createdAt)).limit(4),
    db.select({ exam: P.exam, year: P.year, subject: P.subject, at: P.createdAt }).from(P).orderBy(desc(P.createdAt)).limit(4),
    db.select({ title: QS.title, exam: QS.exam, at: QS.createdAt }).from(QS).orderBy(desc(QS.createdAt)).limit(4),
  ]);

  const items: ActivityItem[] = [
    ...attempts
      .filter((a) => a.completedAt)
      .map((a) => ({
        kind: 'attempt' as const,
        title: a.name,
        subtitle: `took ${l2(a.title)}`,
        at: a.completedAt!.toISOString(),
        value: `${round2(n(a.pct))}%${a.passed ? ' ✓' : ''}`,
      })),
    ...mats.map((m) => ({
      kind: 'material' as const,
      title: l2(m.title),
      subtitle: m.isFree ? `${m.exam} • free material added` : `${m.exam} • material added`,
      at: m.at.toISOString(),
    })),
    ...upds.map((u) => ({
      kind: 'update' as const,
      title: l2(u.title),
      subtitle: `${u.exam} • circular posted`,
      at: u.at.toISOString(),
    })),
    ...pyqs.map((p) => ({
      kind: 'pyq' as const,
      title: `${p.exam} ${p.year} — ${p.subject}`,
      subtitle: 'previous-year question added',
      at: p.at.toISOString(),
    })),
    ...quizzes.map((q) => ({
      kind: 'quiz' as const,
      title: l2(q.title),
      subtitle: `${q.exam} • test created`,
      at: q.at.toISOString(),
    })),
  ];

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

/** Scheduled tests and exam calendar entries that still lie ahead. */
async function upcoming(): Promise<UpcomingItem[]> {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);

  const [opens, closes, dates] = await Promise.all([
    db
      .select({ title: QS.title, exam: QS.exam, startsAt: QS.startsAt })
      .from(QS)
      .where(and(eq(QS.isPublished, true), gte(QS.startsAt, now)))
      .orderBy(QS.startsAt)
      .limit(4),
    db
      .select({ title: QS.title, exam: QS.exam, endsAt: QS.endsAt })
      .from(QS)
      .where(and(eq(QS.isPublished, true), gte(QS.endsAt, now), sql`${QS.endsAt} <= ${weekAhead}`))
      .orderBy(QS.endsAt)
      .limit(4),
    db
      .select({ event: D.event, exam: D.exam, status: D.status, lastDateLabel: D.lastDateLabel, category: D.category })
      .from(D)
      .where(inArray(D.status, ['Upcoming', 'Active', 'Closing Soon']))
      .limit(5),
  ]);

  const items: UpcomingItem[] = [
    ...opens.map((q) => ({
      kind: 'quiz-opens' as const,
      title: l2(q.title),
      subtitle: `${q.exam} • test opens`,
      at: q.startsAt!.toISOString(),
      label: 'Opens',
    })),
    ...closes.map((q) => ({
      kind: 'quiz-closes' as const,
      title: l2(q.title),
      subtitle: `${q.exam} • test closes`,
      at: q.endsAt!.toISOString(),
      label: 'Closes',
    })),
    ...dates.map((d) => ({
      kind: 'exam-date' as const,
      title: l2(d.event),
      subtitle: `${d.exam} • ${d.category.toLowerCase()}`,
      at: null,
      label: d.lastDateLabel || d.status,
    })),
  ];

  // Dated items first (soonest first), then label-only calendar entries
  return items
    .sort((a, b) => (a.at && b.at ? a.at.localeCompare(b.at) : a.at ? -1 : b.at ? 1 : 0))
    .slice(0, 6);
}

// -------------------------------------------------------------------------
// Visitor analytics
// -------------------------------------------------------------------------

async function visitorAnalytics(since: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    [totals],
    [todayStats],
    dailyRows,
    topPagesRows,
    deviceRows,
    browserRows,
    osRows,
    referrerRows,
  ] = await Promise.all([
    // Lifetime totals
    db
      .select({
        totalViews: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${PV.visitorHash})`,
      })
      .from(PV),
    // Today
    db
      .select({
        views: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${PV.visitorHash})`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, today)),
    // Daily breakdown (last 7 days)
    db
      .select({
        day: sql<string>`date(${PV.viewedAt})`,
        views: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${PV.visitorHash})`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(sql`date(${PV.viewedAt})`),
    // Top pages (top 10)
    db
      .select({
        path: PV.path,
        views: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${PV.visitorHash})`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(PV.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    // Device split
    db
      .select({
        type: PV.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(PV.deviceType)
      .orderBy(desc(sql`count(*)`)),
    // Browser split
    db
      .select({
        name: PV.browser,
        count: sql<number>`count(*)`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(PV.browser)
      .orderBy(desc(sql`count(*)`)),
    // OS split
    db
      .select({
        name: PV.os,
        count: sql<number>`count(*)`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(PV.os)
      .orderBy(desc(sql`count(*)`)),
    // Top referrers
    db
      .select({
        source: sql<string>`coalesce(${PV.referrer}, 'Direct')`,
        count: sql<number>`count(*)`,
      })
      .from(PV)
      .where(gte(PV.viewedAt, since))
      .groupBy(sql`coalesce(${PV.referrer}, 'Direct')`)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
  ]);

  // Zero-fill daily series
  const byDay = new Map(dailyRows.map((r) => [dayKey(r.day), r]));
  const daily: { date: string; views: number; visitors: number }[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const hit = byDay.get(key);
    daily.push({ date: key, views: n(hit?.views), visitors: n(hit?.visitors) });
  }

  const last7Views = daily.reduce((s, d) => s + d.views, 0);

  return {
    totalViews: n(totals?.totalViews),
    uniqueVisitors: n(totals?.uniqueVisitors),
    todayViews: n(todayStats?.views),
    todayVisitors: n(todayStats?.visitors),
    last7DaysViews: last7Views,
    daily,
    topPages: topPagesRows.map((r) => ({ path: r.path, views: n(r.views), visitors: n(r.visitors) })),
    devices: deviceRows.map((r) => ({ type: r.type || 'unknown', count: n(r.count) })),
    browsers: browserRows.map((r) => ({ name: r.name || 'Unknown', count: n(r.count) })),
    operatingSystems: osRows.map((r) => ({ name: r.name || 'Unknown', count: n(r.count) })),
    referrers: referrerRows.map((r) => ({ source: r.source || 'Direct', count: n(r.count) })),
  };
}

// -------------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------------

export type DashboardStats = Awaited<ReturnType<typeof dashboardStats>>;

export async function dashboardStats() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const [content, engagement, revenue, series, recent, next, visitors] = await Promise.all([
    contentStats(),
    engagementStats(since),
    revenueStats(since),
    trend(since),
    recentActivity(),
    upcoming(),
    visitorAnalytics(since),
  ]);

  return {
    ...content,
    ...engagement,
    revenue,
    trend: series,
    recent,
    upcoming: next,
    visitors,
    generatedAt: new Date().toISOString(),
    trendDays: TREND_DAYS,
  };
}
