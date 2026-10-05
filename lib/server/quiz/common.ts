// Shared quiz helpers: mappers, validation, totals, cache.
import { createHash } from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db, schema } from '@/db';
import { ValidationError, validators as v } from '../content';
import {
  EXAM_OPTIONS,
  QUESTION_DIFFICULTY_OPTIONS,
  QUIZ_DIFFICULTY_OPTIONS,
  QUIZ_SUBJECT_OPTIONS,
} from '@/lib/adminOptions';
import {
  OPTION_IDS,
  type L2,
  type OptionId,
  type PlayQuestion,
  type QuestionDifficulty,
  type QuizDifficulty,
  type QuizSummary,
} from '@/lib/quizTypes';

export const QS = schema.quizSets;
export const QQ = schema.quizQuestions;
export const QA = schema.quizAttempts;
export type QuizRow = typeof QS.$inferSelect;
export type QuestionRow = typeof QQ.$inferSelect;
export type AttemptRow = typeof QA.$inferSelect;

export const QUIZ_CACHE_TAG = 'quizzes';
export const invalidateQuizzes = () => revalidateTag(QUIZ_CACHE_TAG);

export const GRACE_SECONDS = Math.max(0, Number(process.env.QUIZ_GRACE_SECONDS || 60) || 60);

type Obj = Record<string, unknown>;

// -------------------------------------------------------------------------
// Small utilities
// -------------------------------------------------------------------------

export const num = (d: string | number | null | undefined) => Number(d ?? 0);
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const l2 = (x: Partial<L2> | null | undefined): L2 => {
  const en = x?.en?.trim() || x?.mr?.trim() || '';
  const mr = x?.mr?.trim() || en;
  return { mr, en };
};

/** Deterministic order derived from a seed (same attempt → same option order on resume). */
export function seededOrder<T>(items: T[], seed: string, key: (t: T) => string): T[] {
  const h = (s: string) => createHash('sha256').update(s).digest('hex');
  return [...items].sort((a, b) => (h(`${seed}:${key(a)}`) < h(`${seed}:${key(b)}`) ? -1 : 1));
}

function dec(o: Obj, key: string, min: number, max: number, fallback: number): string {
  const raw = o[key];
  if (raw === undefined || raw === null || raw === '') return fallback.toFixed(2);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${key} must be between ${min} and ${max}`);
  return round2(n).toFixed(2);
}

function optionalDate(o: Obj, key: string): Date | null {
  const raw = o[key];
  if (raw === undefined || raw === null || raw === '') return null;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) throw new ValidationError(`${key} is not a valid date/time`);
  return d;
}

// -------------------------------------------------------------------------
// Mappers
// -------------------------------------------------------------------------

export function toSummary(r: QuizRow, questionCount: number, attemptsCount: number): QuizSummary {
  const instr = r.instructions ? l2(r.instructions) : null;
  return {
    id: r.id,
    slug: r.slug,
    title: l2(r.title),
    description: l2(r.description),
    instructions: instr && (instr.en || instr.mr) ? instr : null,
    exam: r.exam,
    subject: r.subject,
    difficulty: r.difficulty as QuizDifficulty,
    durationMinutes: r.durationMinutes,
    questionCount,
    totalMarks: num(r.totalMarks),
    passPercentage: r.passPercentage,
    negativeMarking: r.negativeMarking,
    negativeLabel: r.negativeMarking ? r.negativeRatio : null,
    badge: r.badge,
    featured: r.isFeatured,
    startsAt: r.startsAt ? r.startsAt.toISOString() : null,
    endsAt: r.endsAt ? r.endsAt.toISOString() : null,
    attemptsCount,
    maxAttempts: r.maxAttempts,
    showSolutions: r.showSolutions,
  };
}

export function toPlayQuestion(q: QuestionRow, attemptSeed: string, shuffleOptions: boolean): PlayQuestion {
  const options = q.options.map((o) => ({ id: o.id, text: l2(o.text) }));
  return {
    id: q.id,
    topic: q.subject,
    difficulty: q.difficulty as QuestionDifficulty,
    question: l2(q.question),
    options: shuffleOptions ? seededOrder(options, `${attemptSeed}:${q.id}`, (o) => o.id) : options,
    marks: num(q.marks),
    negativeMarks: num(q.negativeMarks),
    image: q.image,
  };
}

export function toAdminQuestion(q: QuestionRow) {
  return {
    id: q.id,
    position: q.position,
    topic: q.subject,
    difficulty: q.difficulty as QuestionDifficulty,
    question: l2(q.question),
    options: OPTION_IDS.map((id) => ({ id, text: l2(q.options.find((o) => o.id === id)?.text) })),
    correctOption: q.correctOption as OptionId,
    explanation: l2(q.explanation),
    marks: num(q.marks),
    negativeMarks: num(q.negativeMarks),
    image: q.image,
  };
}
export type AdminQuestionDTO = ReturnType<typeof toAdminQuestion>;

export function toAdminQuiz(
  r: QuizRow,
  stats: { questions: number; attempts: number; avgPercentage: number; passRate: number; participants: number }
) {
  return {
    ...toSummary(r, stats.questions, stats.attempts),
    instructions: l2(r.instructions), // admin always edits both languages
    isPublished: r.isPublished,
    sortOrder: r.sortOrder,
    defaultMarks: num(r.defaultMarks),
    defaultNegativeMarks: num(r.defaultNegativeMarks),
    shuffleQuestions: r.shuffleQuestions,
    shuffleOptions: r.shuffleOptions,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    stats,
  };
}
export type AdminQuizDTO = ReturnType<typeof toAdminQuiz>;

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

export function parseQuizInput(body: Obj) {
  const title = v.localized(body, 'title', { required: true, max: 255 })!;
  const startsAt = optionalDate(body, 'startsAt');
  const endsAt = optionalDate(body, 'endsAt');
  if (startsAt && endsAt && endsAt <= startsAt) throw new ValidationError('End time must be after the start time');

  const slug = v.str(body, 'slug', { max: 120 }).toLowerCase();
  if (slug && !v.SLUG_RE.test(slug)) throw new ValidationError('URL slug may contain only a-z, 0-9 and single hyphens');
  if (['me', 'attempts', 'template'].includes(slug)) throw new ValidationError(`"${slug}" is a reserved URL slug`);

  const instructions = v.localized(body, 'instructions', { max: 4000 });
  return {
    slug: slug || null,
    title: { mr: title.mr, en: title.en },
    description: (() => {
      const d = v.localized(body, 'description', { max: 2000 });
      return d ? { mr: d.mr, en: d.en } : { mr: '', en: '' };
    })(),
    instructions: instructions ? { mr: instructions.mr, en: instructions.en } : null,
    exam: v.oneOf(body, 'exam', EXAM_OPTIONS),
    subject: v.oneOf(body, 'subject', QUIZ_SUBJECT_OPTIONS),
    difficulty: v.oneOf(body, 'difficulty', QUIZ_DIFFICULTY_OPTIONS, 'Mixed') as QuizDifficulty,
    durationMinutes: v.int(body, 'durationMinutes', { min: 1, max: 600 }),
    passPercentage: v.int(body, 'passPercentage', { min: 0, max: 100, fallback: 40 }),
    defaultMarks: dec(body, 'defaultMarks', 0.25, 100, 2),
    defaultNegativeMarks: dec(body, 'defaultNegativeMarks', 0, 100, 0.5),
    badge: v.str(body, 'badge', { max: 64 }) || null,
    shuffleQuestions: v.bool(body, 'shuffleQuestions'),
    shuffleOptions: v.bool(body, 'shuffleOptions'),
    showSolutions: body.showSolutions === undefined ? true : v.bool(body, 'showSolutions'),
    maxAttempts: v.int(body, 'maxAttempts', { min: 0, max: 100, fallback: 0 }),
    startsAt,
    endsAt,
    isFeatured: v.bool(body, 'isFeatured') || v.bool(body, 'featured'),
    sortOrder: v.int(body, 'sortOrder', { min: -100000, max: 100000, fallback: 0 }),
    isPublished: v.bool(body, 'isPublished'),
  };
}
export type QuizInput = ReturnType<typeof parseQuizInput>;

export function parseQuestionInput(body: Obj, defaults: { marks: number; negativeMarks: number }) {
  const question = v.localized(body, 'question', { required: true, max: 4000 })!;

  const rawOptions = Array.isArray(body.options) ? (body.options as Obj[]) : [];
  const options = OPTION_IDS.map((id) => {
    const found = rawOptions.find((o) => o && o.id === id);
    const text = found ? v.localized(found, 'text', { max: 1000 }) : null;
    if (!text) throw new ValidationError(`Option ${id} needs text in at least one language`);
    return { id, text: { mr: text.mr, en: text.en } };
  });

  const correctOption = v.oneOf(body, 'correctOption', OPTION_IDS) as OptionId;
  const explanation = v.localized(body, 'explanation', { max: 6000 });

  return {
    question: { mr: question.mr, en: question.en },
    options,
    correctOption,
    explanation: explanation ? { mr: explanation.mr, en: explanation.en } : { mr: '', en: '' },
    marks: dec(body, 'marks', 0.25, 100, defaults.marks),
    negativeMarks: dec(body, 'negativeMarks', 0, 100, defaults.negativeMarks),
    difficulty: v.oneOf(body, 'difficulty', QUESTION_DIFFICULTY_OPTIONS, 'Medium') as QuestionDifficulty,
    topic: v.str(body, 'topic', { max: 64 }),
    image: v.imageRef(body.image, 'image') || null,
  };
}
export type QuestionInput = ReturnType<typeof parseQuestionInput>;

// -------------------------------------------------------------------------
// Derived totals (kept on the quiz row so lists don't need to sum questions)
// -------------------------------------------------------------------------

export async function recomputeTotals(quizId: string) {
  const rows = await db.select({ marks: QQ.marks, neg: QQ.negativeMarks }).from(QQ).where(eq(QQ.quizSetId, quizId));
  const total = round2(rows.reduce((n, r) => n + num(r.marks), 0));
  const negatives = new Set(rows.map((r) => num(r.neg)).filter((n) => n > 0));
  const ratio =
    negatives.size === 0 ? null : negatives.size === 1 ? `-${[...negatives][0]} प्रति चुकीचे उत्तर` : 'प्रश्नानुसार वेगवेगळे';
  await db
    .update(QS)
    .set({ totalMarks: total.toFixed(2), negativeMarking: negatives.size > 0, negativeRatio: ratio })
    .where(eq(QS.id, quizId));
  return rows.length;
}

export async function questionCounts(): Promise<Map<string, number>> {
  const rows = await db.select({ id: QQ.quizSetId, n: sql<number>`count(*)` }).from(QQ).groupBy(QQ.quizSetId);
  return new Map(rows.map((r) => [r.id, Number(r.n)]));
}

// -------------------------------------------------------------------------
// Public list (cached; invalidated by admin writes)
// -------------------------------------------------------------------------

export const getPublishedQuizzes = unstable_cache(
  async (): Promise<QuizSummary[]> => {
    const sets = await db
      .select()
      .from(QS)
      .where(eq(QS.isPublished, true))
      .orderBy(asc(QS.sortOrder), desc(QS.createdAt));
    const [qCounts, aRows] = await Promise.all([
      questionCounts(),
      db
        .select({ id: QA.quizSetId, n: sql<number>`count(*)` })
        .from(QA)
        .where(and(eq(QA.status, 'submitted')))
        .groupBy(QA.quizSetId),
    ]);
    const aCounts = new Map(aRows.map((r) => [r.id, Number(r.n)]));
    return sets
      .filter((s) => (qCounts.get(s.id) || 0) > 0)
      .map((s) => toSummary(s, qCounts.get(s.id) || 0, aCounts.get(s.id) || 0));
  },
  ['public-quizzes'],
  { tags: [QUIZ_CACHE_TAG], revalidate: 60 }
);
