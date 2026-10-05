// Superadmin students directory.
//
// Student details (name / mobile / email / address) are captured as a snapshot on
// every quiz attempt, so this module turns the attempt log into a people-centric
// view: one row per student, grouped by mobile number, with attempt counts, best
// score and first/last seen timestamps.
//
// Attempts written before the details were collected (or any row missing a mobile)
// fall back to the anonymous browser id so nothing silently disappears from the list.
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { NotFoundError } from '../content';
import { toCsv } from '../csv';
import { QA, QS, l2, num, round2 } from './common';

/** Safety cap: the directory aggregates in memory, so bound how much it reads. */
const MAX_SCAN = 20000;

export const STUDENT_SORTS = ['recent', 'name', 'attempts', 'best'] as const;
export type StudentSort = (typeof STUDENT_SORTS)[number];

export type StudentAttempt = {
  id: number;
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  status: 'in_progress' | 'submitted';
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  passed: boolean;
  isLate: boolean;
  timeTakenSeconds: number;
  startedAt: string;
  completedAt: string | null;
  /** Details exactly as the student typed them for this attempt. */
  name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
};

export type QuizStudent = {
  /** Stable id for this student in the directory (mobile, or `pid:<browser id>`). */
  key: string;
  name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  attempts: number;
  submitted: number;
  inProgress: number;
  /** Distinct tests this student has opened. */
  tests: number;
  passed: number;
  bestPercentage: number;
  avgPercentage: number;
  lastQuizTitle: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type StudentsSummary = {
  students: number;
  attempts: number;
  submitted: number;
  inProgress: number;
  avgPercentage: number;
  newLast7Days: number;
  activeLast7Days: number;
  withEmail: number;
  /** True when the attempt log is larger than MAX_SCAN and the list is partial. */
  truncated: boolean;
};

type AttemptScanRow = Awaited<ReturnType<typeof scanAttempts>>[number];

async function scanAttempts() {
  return db
    .select({
      id: QA.id,
      participantId: QA.participantId,
      name: QA.participantName,
      mobile: QA.participantMobile,
      email: QA.participantEmail,
      address: QA.participantAddress,
      status: QA.status,
      score: QA.score,
      totalMarks: QA.totalMarks,
      percentage: QA.percentage,
      correct: QA.correctCount,
      wrong: QA.wrongCount,
      skipped: QA.skippedCount,
      passed: QA.passed,
      isLate: QA.isLate,
      timeTakenSeconds: QA.timeTakenSeconds,
      startedAt: QA.startedAt,
      completedAt: QA.completedAt,
      quizId: QA.quizSetId,
      quizSlug: QS.slug,
      quizTitle: QS.title,
    })
    .from(QA)
    .leftJoin(QS, eq(QS.id, QA.quizSetId))
    .orderBy(desc(QA.startedAt), desc(QA.id))
    .limit(MAX_SCAN + 1);
}

/** Mobile is the identity when present; otherwise keep the browser identity. */
const keyOf = (r: { mobile: string | null; participantId: string }) => r.mobile || `pid:${r.participantId}`;

const titleOf = (r: AttemptScanRow) => {
  const t = l2(r.quizTitle);
  return t.mr || t.en || r.quizId;
};

function toAttempt(r: AttemptScanRow): StudentAttempt {
  return {
    id: r.id,
    quizId: r.quizId,
    quizSlug: r.quizSlug ?? '',
    quizTitle: titleOf(r),
    status: r.status,
    score: num(r.score),
    totalMarks: num(r.totalMarks),
    percentage: num(r.percentage),
    correct: r.correct,
    wrong: r.wrong,
    skipped: r.skipped,
    passed: r.passed,
    isLate: r.isLate,
    timeTakenSeconds: r.timeTakenSeconds,
    startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    name: r.name,
    mobile: r.mobile,
    email: r.email,
    address: r.address,
  };
}

/**
 * Collapses the attempt log into one record per student.
 * Rows arrive newest-first, so the first row seen for a key holds the latest details.
 */
function groupStudents(rows: AttemptScanRow[]) {
  const map = new Map<string, { student: QuizStudent; tests: Set<string>; pctSum: number; pctCount: number }>();

  for (const r of rows) {
    const key = keyOf(r);
    const pct = num(r.percentage);
    const startedAt = r.startedAt.toISOString();
    let entry = map.get(key);

    if (!entry) {
      // Newest attempt wins for the contact details shown in the directory
      entry = {
        student: {
          key,
          name: r.name,
          mobile: r.mobile,
          email: r.email,
          address: r.address,
          attempts: 0,
          submitted: 0,
          inProgress: 0,
          tests: 0,
          passed: 0,
          bestPercentage: 0,
          avgPercentage: 0,
          lastQuizTitle: titleOf(r),
          firstSeenAt: startedAt,
          lastSeenAt: startedAt,
        },
        tests: new Set<string>(),
        pctSum: 0,
        pctCount: 0,
      };
      map.set(key, entry);
    } else if (!entry.student.email && r.email) {
      entry.student.email = r.email; // keep the best contact info we ever received
    }

    const s = entry.student;
    s.attempts++;
    entry.tests.add(r.quizId);
    if (r.status === 'submitted') {
      s.submitted++;
      if (r.passed) s.passed++;
      if (pct > s.bestPercentage) s.bestPercentage = pct;
      entry.pctSum += pct;
      entry.pctCount++;
    } else {
      s.inProgress++;
    }
    if (startedAt < s.firstSeenAt) s.firstSeenAt = startedAt;
    if (startedAt > s.lastSeenAt) s.lastSeenAt = startedAt;
  }

  return [...map.values()].map(({ student, tests, pctSum, pctCount }) => {
    student.tests = tests.size;
    student.bestPercentage = round2(student.bestPercentage);
    student.avgPercentage = pctCount ? round2(pctSum / pctCount) : 0;
    return student;
  });
}

const needle = (q: string) => q.trim().toLowerCase();

function matches(s: QuizStudent, q: string) {
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  return (
    s.name.toLowerCase().includes(q) ||
    (!!s.mobile && (s.mobile.includes(q) || (digits.length >= 3 && s.mobile.includes(digits)))) ||
    (!!s.email && s.email.toLowerCase().includes(q)) ||
    (!!s.address && s.address.toLowerCase().includes(q))
  );
}

function sortStudents(list: QuizStudent[], sort: StudentSort) {
  const byRecent = (a: QuizStudent, b: QuizStudent) => b.lastSeenAt.localeCompare(a.lastSeenAt);
  const cmp: Record<StudentSort, (a: QuizStudent, b: QuizStudent) => number> = {
    recent: byRecent,
    name: (a, b) => a.name.localeCompare(b.name, 'mr') || byRecent(a, b),
    attempts: (a, b) => b.attempts - a.attempts || byRecent(a, b),
    best: (a, b) => b.bestPercentage - a.bestPercentage || byRecent(a, b),
  };
  return [...list].sort(cmp[sort]);
}

function summarize(all: QuizStudent[], truncated: boolean): StudentsSummary {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  let attempts = 0;
  let submitted = 0;
  let inProgress = 0;
  let pctSum = 0;
  let pctCount = 0;
  let newLast7Days = 0;
  let activeLast7Days = 0;
  let withEmail = 0;

  for (const s of all) {
    attempts += s.attempts;
    submitted += s.submitted;
    inProgress += s.inProgress;
    if (s.submitted) {
      pctSum += s.avgPercentage * s.submitted;
      pctCount += s.submitted;
    }
    if (s.firstSeenAt >= weekAgo) newLast7Days++;
    if (s.lastSeenAt >= weekAgo) activeLast7Days++;
    if (s.email) withEmail++;
  }

  return {
    students: all.length,
    attempts,
    submitted,
    inProgress,
    avgPercentage: pctCount ? round2(pctSum / pctCount) : 0,
    newLast7Days,
    activeLast7Days,
    withEmail,
    truncated,
  };
}

// -------------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------------

export type ListStudentsOptions = {
  search?: string;
  sort?: StudentSort;
  limit?: number;
  offset?: number;
};

/** Paged students directory. The summary always reflects every student, not just the page. */
export async function listQuizStudents(opts: ListStudentsOptions = {}) {
  const scanned = await scanAttempts();
  const truncated = scanned.length > MAX_SCAN;
  const all = groupStudents(truncated ? scanned.slice(0, MAX_SCAN) : scanned);

  const q = needle(opts.search || '');
  const filtered = q ? all.filter((s) => matches(s, q)) : all;
  const sorted = sortStudents(filtered, STUDENT_SORTS.includes(opts.sort as StudentSort) ? (opts.sort as StudentSort) : 'recent');

  const limit = Math.min(200, Math.max(1, opts.limit || 50));
  const offset = Math.max(0, opts.offset || 0);

  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
    summary: summarize(all, truncated),
  };
}

/** One student plus their full attempt history (newest first). */
export async function getQuizStudent(key: string) {
  const wanted = (key || '').trim();
  if (!wanted) throw new NotFoundError('Student not found');

  const rows = (await scanAttempts()).filter((r) => keyOf(r) === wanted);
  if (!rows.length) throw new NotFoundError('Student not found');

  const [student] = groupStudents(rows);
  return { student, attempts: rows.map(toAttempt) };
}

/** Full export of the (optionally filtered) directory — not limited to one page. */
export async function quizStudentsCsv(search?: string) {
  const scanned = await scanAttempts();
  const grouped = groupStudents(scanned.slice(0, MAX_SCAN));
  const q = needle(search || '');
  const all = sortStudents(q ? grouped.filter((s) => matches(s, q)) : grouped, 'recent');

  const rows: (string | number)[][] = [
    [
      'Name', 'Mobile', 'Email', 'Address', 'Attempts', 'Submitted', 'In progress', 'Tests',
      'Passed', 'Best %', 'Average %', 'Last test', 'First attempt (ISO)', 'Last attempt (ISO)',
    ],
    ...all.map((s) => [
      s.name, s.mobile ?? '', s.email ?? '', s.address ?? '', s.attempts, s.submitted, s.inProgress, s.tests,
      s.passed, s.bestPercentage, s.avgPercentage, s.lastQuizTitle, s.firstSeenAt, s.lastSeenAt,
    ]),
  ];
  return { filename: 'quiz-students.csv', csv: toCsv(rows) };
}
