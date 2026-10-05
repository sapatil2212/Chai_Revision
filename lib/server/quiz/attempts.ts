// Public quiz engine: start / resume / autosave / submit attempts, scoring, ranking, leaderboard.
// Correct answers never leave the server until an attempt is submitted.
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { HttpError, NotFoundError } from '../content';
import {
  OPTION_IDS,
  quizStatus,
  type AttemptResult,
  type AttemptSession,
  type LeaderboardEntry,
  type OptionId,
  type QuestionReview,
} from '@/lib/quizTypes';
import {
  GRACE_SECONDS,
  QA,
  QQ,
  QS,
  l2,
  num,
  round2,
  seededOrder,
  toPlayQuestion,
  toSummary,
  type AttemptRow,
  type QuestionRow,
  type QuizRow,
} from './common';

// -------------------------------------------------------------------------
// Participant identity & tokens
// -------------------------------------------------------------------------

export const PARTICIPANT_COOKIE = 'cr_pid';
export const newParticipantId = () => randomBytes(16).toString('hex');
export const isValidParticipantId = (v: string | undefined): v is string => !!v && /^[a-f0-9]{32}$/.test(v);

function secret() {
  const s = process.env.QUIZ_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('QUIZ_TOKEN_SECRET is missing or too short (min 32 chars).');
  return s;
}

/** Token binds an attempt id to the participant who started it. */
export const attemptToken = (attemptId: number, participantId: string) =>
  createHmac('sha256', secret()).update(`quiz-attempt:${attemptId}:${participantId}`).digest('base64url');

function verifyToken(attempt: AttemptRow, token: unknown) {
  if (typeof token !== 'string' || !token) throw new HttpError(401, 'Invalid attempt token');
  const expected = Buffer.from(attemptToken(attempt.id, attempt.participantId));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new HttpError(401, 'Invalid attempt token');
  }
}

const strip = (v: unknown, max: number) =>
  (typeof v === 'string' ? v : '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Validates the details collected from the student before a test.
 * Name, mobile and address are required; email is optional.
 */
export function parseStudentDetails(raw: unknown): {
  name: string;
  mobile: string;
  email: string | null;
  address: string;
} {
  const o = (raw ?? {}) as Record<string, unknown>;

  const name = strip(o.name, 40);
  if (name.length < 2) throw new HttpError(400, 'Please enter your full name.');

  // Accept +91 / 0 prefixes and spaces or dashes, store 10 digits
  const digits = (typeof o.mobile === 'string' ? o.mobile : '').replace(/\D/g, '');
  const mobile = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new HttpError(400, 'Please enter a valid 10-digit mobile number.');
  }

  const emailRaw = strip(o.email, 191).toLowerCase();
  if (emailRaw && !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(emailRaw)) {
    throw new HttpError(400, 'Please enter a valid email address, or leave it empty.');
  }

  const address = strip(o.address, 300);
  if (address.length < 4) throw new HttpError(400, 'Please enter your address (village/city and district).');

  return { name, mobile, email: emailRaw || null, address };
}

// -------------------------------------------------------------------------
// Loading helpers
// -------------------------------------------------------------------------

async function quizBySlug(slug: string): Promise<QuizRow> {
  const [row] = await db.select().from(QS).where(and(eq(QS.slug, slug), eq(QS.isPublished, true)));
  if (!row) throw new NotFoundError('Quiz not found');
  return row;
}

async function loadAttempt(id: number): Promise<AttemptRow> {
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Attempt not found');
  const [row] = await db.select().from(QA).where(eq(QA.id, id));
  if (!row) throw new NotFoundError('Attempt not found');
  return row;
}

async function questionsFor(quizId: string): Promise<QuestionRow[]> {
  return db.select().from(QQ).where(eq(QQ.quizSetId, quizId)).orderBy(asc(QQ.position));
}

const deadlineMs = (a: AttemptRow, quiz: QuizRow) => a.startedAt.getTime() + quiz.durationMinutes * 60_000;

function sanitizeAnswers(raw: unknown, allowed: string[]): Record<string, OptionId | null> {
  const out: Record<string, OptionId | null> = {};
  if (!raw || typeof raw !== 'object') return out;
  const set = new Set(allowed);
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!set.has(k)) continue;
    out[k] = typeof val === 'string' && (OPTION_IDS as string[]).includes(val) ? (val as OptionId) : null;
  }
  return out;
}

async function buildSession(attempt: AttemptRow, quiz: QuizRow, resumed: boolean): Promise<AttemptSession> {
  const rows = await questionsFor(quiz.id);
  const byId = new Map(rows.map((q) => [q.id, q]));
  // Questions deleted after the attempt started are skipped
  const ordered = attempt.questionOrder.map((id) => byId.get(id)).filter((q): q is QuestionRow => !!q);
  return {
    attemptId: attempt.id,
    token: attemptToken(attempt.id, attempt.participantId),
    participantName: attempt.participantName,
    quiz: toSummary(quiz, ordered.length, 0),
    questions: ordered.map((q) => toPlayQuestion(q, String(attempt.id), quiz.shuffleOptions)),
    answers: attempt.answers,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: new Date(deadlineMs(attempt, quiz)).toISOString(),
    serverNow: new Date().toISOString(),
    resumed,
  };
}

// -------------------------------------------------------------------------
// Start / resume
// -------------------------------------------------------------------------

export async function startAttempt(slug: string, participantId: string, rawDetails: unknown) {
  const details = parseStudentDetails(rawDetails);
  const quiz = await quizBySlug(slug);
  const status = quizStatus({
    startsAt: quiz.startsAt?.toISOString() ?? null,
    endsAt: quiz.endsAt?.toISOString() ?? null,
  });
  if (status === 'upcoming') throw new HttpError(409, 'This test has not started yet.');
  if (status === 'ended') throw new HttpError(409, 'This test has ended.');

  // Resume an unfinished attempt instead of creating duplicates (refresh / reopen)
  const open = await db
    .select()
    .from(QA)
    .where(and(eq(QA.quizSetId, quiz.id), eq(QA.participantId, participantId), eq(QA.status, 'in_progress')))
    .orderBy(desc(QA.startedAt));
  for (const a of open) {
    if (Date.now() <= deadlineMs(a, quiz)) return buildSession(a, quiz, true);
    await finalizeAttempt(a, quiz, a.answers); // time ran out while away: auto-submit
  }

  if (quiz.maxAttempts > 0) {
    const done = await db
      .select({ id: QA.id })
      .from(QA)
      .where(and(eq(QA.quizSetId, quiz.id), eq(QA.participantId, participantId), eq(QA.status, 'submitted')));
    if (done.length >= quiz.maxAttempts) {
      throw new HttpError(403, `You have used all ${quiz.maxAttempts} attempt(s) for this test.`);
    }
  }

  const questions = await questionsFor(quiz.id);
  if (!questions.length) throw new HttpError(409, 'This test has no questions yet.');
  const ids = questions.map((q) => q.id);
  const order = quiz.shuffleQuestions ? seededOrder(ids, randomBytes(8).toString('hex'), (x) => x) : ids;

  const res = await db.insert(QA).values({
    participantId,
    participantName: details.name,
    participantMobile: details.mobile,
    participantEmail: details.email,
    participantAddress: details.address,
    quizSetId: quiz.id,
    status: 'in_progress',
    questionOrder: order,
    answers: {},
    totalMarks: round2(questions.reduce((n, q) => n + num(q.marks), 0)).toFixed(2),
    startedAt: new Date(),
  });
  const attemptId = Number((res as unknown as [{ insertId: number }])[0].insertId);
  return buildSession(await loadAttempt(attemptId), quiz, false);
}

/** Re-open an attempt (page refresh). Expired attempts are auto-submitted and the result returned. */
export async function getAttempt(attemptId: number, token: unknown) {
  const attempt = await loadAttempt(attemptId);
  verifyToken(attempt, token);
  const [quiz] = await db.select().from(QS).where(eq(QS.id, attempt.quizSetId));
  if (!quiz) throw new NotFoundError('Quiz not found');

  if (attempt.status === 'submitted') return { result: await buildResult(attempt, quiz) };
  if (Date.now() > deadlineMs(attempt, quiz) + GRACE_SECONDS * 1000) {
    return { result: await finalizeAttempt(attempt, quiz, attempt.answers) };
  }
  return { session: await buildSession(attempt, quiz, true) };
}

/** Autosave answers during the test so progress survives refreshes and device sleep. */
export async function saveAnswers(attemptId: number, token: unknown, rawAnswers: unknown) {
  const attempt = await loadAttempt(attemptId);
  verifyToken(attempt, token);
  if (attempt.status !== 'in_progress') throw new HttpError(409, 'This attempt is already submitted.');
  const [quiz] = await db.select().from(QS).where(eq(QS.id, attempt.quizSetId));
  if (!quiz) throw new NotFoundError('Quiz not found');
  if (Date.now() > deadlineMs(attempt, quiz) + GRACE_SECONDS * 1000) throw new HttpError(409, 'Time is over for this attempt.');
  const answers = sanitizeAnswers(rawAnswers, attempt.questionOrder);
  await db.update(QA).set({ answers }).where(and(eq(QA.id, attemptId), eq(QA.status, 'in_progress')));
  return { saved: Object.values(answers).filter(Boolean).length };
}

// -------------------------------------------------------------------------
// Submit & scoring
// -------------------------------------------------------------------------

export async function submitAttempt(attemptId: number, token: unknown, rawAnswers: unknown) {
  const attempt = await loadAttempt(attemptId);
  verifyToken(attempt, token);
  const [quiz] = await db.select().from(QS).where(eq(QS.id, attempt.quizSetId));
  if (!quiz) throw new NotFoundError('Quiz not found');
  // Idempotent: a second submit (double click, retry) returns the stored result
  if (attempt.status === 'submitted') return buildResult(attempt, quiz);

  const late = Date.now() > deadlineMs(attempt, quiz) + GRACE_SECONDS * 1000;
  // Late submissions keep the last autosaved answers; on-time submissions use what the browser sends
  const answers =
    rawAnswers === undefined || late
      ? attempt.answers
      : { ...attempt.answers, ...sanitizeAnswers(rawAnswers, attempt.questionOrder) };
  return finalizeAttempt(attempt, quiz, answers);
}

async function finalizeAttempt(attempt: AttemptRow, quiz: QuizRow, answers: Record<string, OptionId | null>) {
  const questions = await db.select().from(QQ).where(inArray(QQ.id, attempt.questionOrder.length ? attempt.questionOrder : ['-']));
  const byId = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  let total = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const id of attempt.questionOrder) {
    const q = byId.get(id);
    if (!q) continue;
    total += num(q.marks);
    const sel = answers[id];
    if (!sel) skipped++;
    else if (sel === q.correctOption) {
      correct++;
      score += num(q.marks);
    } else {
      wrong++;
      score -= num(q.negativeMarks);
    }
  }

  const elapsed = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
  const limit = quiz.durationMinutes * 60;
  const isLate = elapsed > limit + GRACE_SECONDS;
  const percentage = total > 0 ? round2(Math.max(0, (score / total) * 100)) : 0;

  await db
    .update(QA)
    .set({
      status: 'submitted',
      answers,
      score: round2(score).toFixed(2),
      totalMarks: round2(total).toFixed(2),
      percentage: percentage.toFixed(2),
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      passed: percentage >= quiz.passPercentage,
      isLate,
      timeTakenSeconds: Math.min(elapsed, limit),
      completedAt: new Date(),
    })
    .where(and(eq(QA.id, attempt.id), eq(QA.status, 'in_progress')));

  return buildResult(await loadAttempt(attempt.id), quiz);
}

/** Best (score desc, time asc) on-time attempt per participant. */
async function rankings(quizId: string) {
  const rows = await db
    .select({
      id: QA.id,
      participantId: QA.participantId,
      name: QA.participantName,
      score: QA.score,
      percentage: QA.percentage,
      time: QA.timeTakenSeconds,
      completedAt: QA.completedAt,
    })
    .from(QA)
    .where(and(eq(QA.quizSetId, quizId), eq(QA.status, 'submitted'), eq(QA.isLate, false)))
    .orderBy(desc(QA.score), asc(QA.timeTakenSeconds), asc(QA.completedAt))
    .limit(20000);
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.participantId) ? false : (seen.add(r.participantId), true)));
}

async function buildResult(attempt: AttemptRow, quiz: QuizRow): Promise<AttemptResult> {
  const questions = await db.select().from(QQ).where(inArray(QQ.id, attempt.questionOrder.length ? attempt.questionOrder : ['-']));
  const byId = new Map(questions.map((q) => [q.id, q]));

  const review: QuestionReview[] = attempt.questionOrder
    .map((id) => byId.get(id))
    .filter((q): q is QuestionRow => !!q)
    .map((q) => {
      const selected = attempt.answers[q.id] ?? null;
      const status = !selected ? 'skipped' : selected === q.correctOption ? 'correct' : 'wrong';
      const expl = l2(q.explanation);
      return {
        id: q.id,
        topic: q.subject,
        question: l2(q.question),
        options: q.options.map((o) => ({ id: o.id, text: l2(o.text) })),
        image: q.image,
        marks: num(q.marks),
        negativeMarks: num(q.negativeMarks),
        selected,
        status,
        marksAwarded: status === 'correct' ? num(q.marks) : status === 'wrong' ? -num(q.negativeMarks) : 0,
        correctOption: quiz.showSolutions ? (q.correctOption as OptionId) : null,
        explanation: quiz.showSolutions && (expl.mr || expl.en) ? expl : null,
      };
    });

  let rank: number | null = null;
  let participants = 0;
  if (!attempt.isLate) {
    const board = await rankings(quiz.id);
    participants = board.length;
    const mine = { score: num(attempt.score), time: attempt.timeTakenSeconds };
    // Rank = 1 + number of other participants whose best beats this attempt
    rank =
      1 +
      board.filter(
        (b) =>
          b.participantId !== attempt.participantId &&
          (num(b.score) > mine.score || (num(b.score) === mine.score && b.time < mine.time))
      ).length;
  }

  return {
    attemptId: attempt.id,
    quizSlug: quiz.slug,
    score: num(attempt.score),
    totalMarks: num(attempt.totalMarks),
    percentage: num(attempt.percentage),
    correct: attempt.correctCount,
    wrong: attempt.wrongCount,
    skipped: attempt.skippedCount,
    passed: attempt.passed,
    passPercentage: quiz.passPercentage,
    timeTakenSeconds: attempt.timeTakenSeconds,
    isLate: attempt.isLate,
    rank,
    participants,
    showSolutions: quiz.showSolutions,
    review,
  };
}

// -------------------------------------------------------------------------
// Leaderboard & personal history
// -------------------------------------------------------------------------

export async function leaderboard(slug: string, participantId: string | undefined, limit = 10) {
  const quiz = await quizBySlug(slug);
  const board = await rankings(quiz.id);
  const toEntry = (r: (typeof board)[number], i: number): LeaderboardEntry => ({
    rank: i + 1,
    name: r.name,
    score: num(r.score),
    percentage: num(r.percentage),
    timeTakenSeconds: r.time,
    completedAt: r.completedAt?.toISOString() ?? '',
    isYou: !!participantId && r.participantId === participantId,
  });
  const top = board.slice(0, Math.min(50, Math.max(1, limit))).map(toEntry);
  const myIndex = participantId ? board.findIndex((r) => r.participantId === participantId) : -1;
  return {
    participants: board.length,
    top,
    you: myIndex >= limit ? toEntry(board[myIndex], myIndex) : null,
  };
}

/** Submitted attempts by this browser (for "my attempts" history). */
export async function myAttempts(participantId: string) {
  const rows = await db
    .select({
      id: QA.id,
      quizSetId: QA.quizSetId,
      score: QA.score,
      totalMarks: QA.totalMarks,
      percentage: QA.percentage,
      passed: QA.passed,
      completedAt: QA.completedAt,
      slug: QS.slug,
      title: QS.title,
    })
    .from(QA)
    .innerJoin(QS, eq(QS.id, QA.quizSetId))
    .where(and(eq(QA.participantId, participantId), eq(QA.status, 'submitted')))
    .orderBy(desc(QA.completedAt))
    .limit(50);
  return rows.map((r) => ({
    attemptId: r.id,
    token: attemptToken(r.id, participantId),
    quizSlug: r.slug,
    title: l2(r.title),
    score: num(r.score),
    totalMarks: num(r.totalMarks),
    percentage: num(r.percentage),
    passed: r.passed,
    completedAt: r.completedAt?.toISOString() ?? '',
  }));
}
