// Admin-side quiz management: quizzes, questions, CSV import/export, analytics.
import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { NotFoundError, ValidationError, slugify } from '../content';
import { commitImage, deleteStoredFile } from '../storage';
import { parseCsv, toCsv } from '../csv';
import { QUESTION_CSV_COLUMNS } from '@/lib/adminOptions';
import { OPTION_IDS, type OptionId } from '@/lib/quizTypes';
import {
  QA,
  QQ,
  QS,
  invalidateQuizzes,
  num,
  parseQuestionInput,
  parseQuizInput,
  questionCounts,
  recomputeTotals,
  round2,
  toAdminQuestion,
  toAdminQuiz,
  type QuestionInput,
  type QuizRow,
} from './common';

const newId = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 10)}`;

async function getQuizRow(id: string): Promise<QuizRow> {
  const [row] = await db.select().from(QS).where(eq(QS.id, id));
  if (!row) throw new NotFoundError('Quiz not found');
  return row;
}

async function attemptStats() {
  const rows = await db
    .select({
      id: QA.quizSetId,
      attempts: sql<number>`count(*)`,
      participants: sql<number>`count(distinct ${QA.participantId})`,
      avgPct: sql<number>`avg(${QA.percentage})`,
      passed: sql<number>`sum(case when ${QA.passed} then 1 else 0 end)`,
    })
    .from(QA)
    .where(eq(QA.status, 'submitted'))
    .groupBy(QA.quizSetId);
  return new Map(rows.map((r) => [r.id, r]));
}

function statsFor(id: string, qCounts: Map<string, number>, aStats: Awaited<ReturnType<typeof attemptStats>>) {
  const a = aStats.get(id);
  const attempts = Number(a?.attempts || 0);
  return {
    questions: qCounts.get(id) || 0,
    attempts,
    participants: Number(a?.participants || 0),
    avgPercentage: round2(Number(a?.avgPct || 0)),
    passRate: attempts ? round2((Number(a?.passed || 0) / attempts) * 100) : 0,
  };
}

async function uniqueSlug(requested: string | null, title: string, id: string) {
  const taken = async (slug: string) =>
    (await db.select({ id: QS.id }).from(QS).where(and(eq(QS.slug, slug), ne(QS.id, id)))).length > 0;
  if (requested) {
    if (await taken(requested)) throw new ValidationError(`The URL slug "${requested}" is already used by another quiz`);
    return requested;
  }
  const base = slugify(title) || id;
  return (await taken(base)) ? `${base}-${id.slice(-6)}` : base;
}

async function cleanupImages(refs: (string | null)[], exceptQuestionId?: string) {
  const list = refs.filter((r): r is string => !!r);
  if (!list.length) return;
  const still = await db
    .select({ image: QQ.image })
    .from(QQ)
    .where(exceptQuestionId ? and(inArray(QQ.image, list), ne(QQ.id, exceptQuestionId)) : inArray(QQ.image, list));
  const used = new Set(still.map((r) => r.image));
  await Promise.all(list.filter((r) => !used.has(r)).map(deleteStoredFile));
}

// -------------------------------------------------------------------------
// Quizzes
// -------------------------------------------------------------------------

export async function listQuizzes() {
  const [rows, qCounts, aStats] = await Promise.all([
    db.select().from(QS).orderBy(asc(QS.sortOrder), desc(QS.createdAt)),
    questionCounts(),
    attemptStats(),
  ]);
  return rows.map((r) => toAdminQuiz(r, statsFor(r.id, qCounts, aStats)));
}

export async function getQuiz(id: string) {
  const row = await getQuizRow(id);
  const [questions, qCounts, aStats] = await Promise.all([
    db.select().from(QQ).where(eq(QQ.quizSetId, id)).orderBy(asc(QQ.position)),
    questionCounts(),
    attemptStats(),
  ]);
  return { quiz: toAdminQuiz(row, statsFor(id, qCounts, aStats)), questions: questions.map(toAdminQuestion) };
}

async function assertPublishable(id: string, isPublished: boolean) {
  if (!isPublished) return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(QQ).where(eq(QQ.quizSetId, id));
  if (!Number(n)) throw new ValidationError('Add at least one question before publishing this quiz');
}

export async function createQuiz(body: Record<string, unknown>) {
  const input = parseQuizInput({ ...body, isPublished: false }); // new quizzes start as drafts
  const id = newId('quiz');
  const slug = await uniqueSlug(input.slug, input.title.en, id);
  await db.insert(QS).values({ ...input, id, slug, totalMarks: '0' });
  invalidateQuizzes();
  return (await getQuiz(id)).quiz;
}

export async function updateQuiz(id: string, patch: Record<string, unknown>) {
  const existing = await getQuizRow(id);
  const current = toAdminQuiz(existing, { questions: 0, attempts: 0, participants: 0, avgPercentage: 0, passRate: 0 });
  const input = parseQuizInput({ ...current, isFeatured: current.featured, ...patch });
  await assertPublishable(id, input.isPublished);
  const slug = await uniqueSlug(input.slug ?? existing.slug, input.title.en, id);
  await db.update(QS).set({ ...input, slug }).where(eq(QS.id, id));
  invalidateQuizzes();
  return (await getQuiz(id)).quiz;
}

export async function deleteQuiz(id: string) {
  await getQuizRow(id);
  const images = (await db.select({ image: QQ.image }).from(QQ).where(eq(QQ.quizSetId, id))).map((r) => r.image);
  await db.delete(QS).where(eq(QS.id, id)); // cascades questions + attempts
  await cleanupImages(images);
  invalidateQuizzes();
}

export async function duplicateQuiz(id: string) {
  const src = await getQuizRow(id);
  const questions = await db.select().from(QQ).where(eq(QQ.quizSetId, id)).orderBy(asc(QQ.position));
  const copyId = newId('quiz');
  const title = { ...src.title, en: `${src.title.en} (Copy)`, mr: `${src.title.mr} (प्रत)` };
  const slug = await uniqueSlug(null, title.en, copyId);
  const { createdAt: _c, updatedAt: _u, ...rest } = src;
  void _c;
  void _u;
  await db.insert(QS).values({ ...rest, id: copyId, slug, title, isPublished: false, isFeatured: false });
  if (questions.length) {
    await db.insert(QQ).values(questions.map((q) => ({ ...q, id: newId('q'), quizSetId: copyId })));
  }
  invalidateQuizzes();
  return (await getQuiz(copyId)).quiz;
}

// -------------------------------------------------------------------------
// Questions
// -------------------------------------------------------------------------

async function defaultsFor(quiz: QuizRow) {
  return { marks: num(quiz.defaultMarks), negativeMarks: num(quiz.defaultNegativeMarks) };
}

function questionValues(quiz: QuizRow, input: QuestionInput) {
  const { topic, ...rest } = input;
  return { ...rest, subject: topic || quiz.subject, category: quiz.subject, exam: quiz.exam };
}

export async function addQuestion(quizId: string, body: Record<string, unknown>) {
  const quiz = await getQuizRow(quizId);
  const input = parseQuestionInput(body, await defaultsFor(quiz));
  const image = input.image ? await commitImage(input.image) : null;
  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`coalesce(max(${QQ.position}), -1)` })
    .from(QQ)
    .where(eq(QQ.quizSetId, quizId));
  const id = newId('q');
  await db.insert(QQ).values({ ...questionValues(quiz, input), image, id, quizSetId: quizId, position: Number(maxPos) + 1 });
  await recomputeTotals(quizId);
  invalidateQuizzes();
  const [row] = await db.select().from(QQ).where(eq(QQ.id, id));
  return toAdminQuestion(row);
}

async function getQuestionRow(quizId: string, qid: string) {
  const [row] = await db.select().from(QQ).where(and(eq(QQ.id, qid), eq(QQ.quizSetId, quizId)));
  if (!row) throw new NotFoundError('Question not found');
  return row;
}

export async function updateQuestion(quizId: string, qid: string, patch: Record<string, unknown>) {
  const quiz = await getQuizRow(quizId);
  const existing = await getQuestionRow(quizId, qid);
  const input = parseQuestionInput({ ...toAdminQuestion(existing), ...patch }, await defaultsFor(quiz));
  const image = input.image ? await commitImage(input.image) : null;
  await db.update(QQ).set({ ...questionValues(quiz, input), image }).where(eq(QQ.id, qid));
  if (existing.image && existing.image !== image) await cleanupImages([existing.image], qid);
  await recomputeTotals(quizId);
  invalidateQuizzes();
  return toAdminQuestion(await getQuestionRow(quizId, qid));
}

export async function deleteQuestion(quizId: string, qid: string) {
  const existing = await getQuestionRow(quizId, qid);
  await db.delete(QQ).where(eq(QQ.id, qid));
  await cleanupImages([existing.image]);
  const remaining = await recomputeTotals(quizId);
  // A published quiz with no questions would be broken for students
  if (remaining === 0) await db.update(QS).set({ isPublished: false }).where(eq(QS.id, quizId));
  invalidateQuizzes();
  return { remaining, unpublished: remaining === 0 };
}

export async function duplicateQuestion(quizId: string, qid: string) {
  const src = await getQuestionRow(quizId, qid);
  const id = newId('q');
  // Insert right after the original
  await db
    .update(QQ)
    .set({ position: sql`${QQ.position} + 1` })
    .where(and(eq(QQ.quizSetId, quizId), sql`${QQ.position} > ${src.position}`));
  await db.insert(QQ).values({ ...src, id, position: src.position + 1 });
  await recomputeTotals(quizId);
  invalidateQuizzes();
  return toAdminQuestion(await getQuestionRow(quizId, id));
}

export async function reorderQuestions(quizId: string, ids: string[]) {
  const rows = await db.select({ id: QQ.id }).from(QQ).where(eq(QQ.quizSetId, quizId));
  const existing = new Set(rows.map((r) => r.id));
  if (ids.length !== existing.size || !ids.every((id) => existing.has(id)) || new Set(ids).size !== ids.length) {
    throw new ValidationError('Order must list every question of this quiz exactly once');
  }
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(QQ).set({ position: i }).where(eq(QQ.id, ids[i]));
    }
  });
  invalidateQuizzes();
}

/** Set marks / negative marks on every question (and as the quiz default). */
export async function applyMarksToAll(quizId: string, body: Record<string, unknown>) {
  await getQuizRow(quizId);
  const marks = Number(body.marks);
  const neg = Number(body.negativeMarks);
  if (!Number.isFinite(marks) || marks < 0.25 || marks > 100) throw new ValidationError('marks must be between 0.25 and 100');
  if (!Number.isFinite(neg) || neg < 0 || neg > 100) throw new ValidationError('negativeMarks must be between 0 and 100');
  await db
    .update(QQ)
    .set({ marks: round2(marks).toFixed(2), negativeMarks: round2(neg).toFixed(2) })
    .where(eq(QQ.quizSetId, quizId));
  await db
    .update(QS)
    .set({ defaultMarks: round2(marks).toFixed(2), defaultNegativeMarks: round2(neg).toFixed(2) })
    .where(eq(QS.id, quizId));
  const n = await recomputeTotals(quizId);
  invalidateQuizzes();
  return { updated: n };
}

// -------------------------------------------------------------------------
// CSV import / export
// -------------------------------------------------------------------------

export type CsvImportError = { row: number; message: string };

export async function importQuestionsCsv(quizId: string, csv: string, mode: 'append' | 'replace') {
  const quiz = await getQuizRow(quizId);
  const defaults = await defaultsFor(quiz);
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new ValidationError('The CSV needs a header row and at least one question row');
  if (rows.length > 1001) throw new ValidationError('At most 1000 questions can be imported at once');

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const missing = ['correct_option'].filter((c) => !header.includes(c));
  if (missing.length) throw new ValidationError(`Missing column(s): ${missing.join(', ')}. Download the template for the exact format.`);
  const col = (r: string[], name: (typeof QUESTION_CSV_COLUMNS)[number]) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? '').trim() : '';
  };

  const errors: CsvImportError[] = [];
  const inputs: QuestionInput[] = [];
  rows.slice(1).forEach((r, idx) => {
    const rowNo = idx + 2; // spreadsheet row number (header = 1)
    try {
      let correct = col(r, 'correct_option').toUpperCase();
      if (/^[1-4]$/.test(correct)) correct = OPTION_IDS[Number(correct) - 1];
      const difficulty = col(r, 'difficulty');
      inputs.push(
        parseQuestionInput(
          {
            question: { mr: col(r, 'question_mr'), en: col(r, 'question_en') },
            options: OPTION_IDS.map((id) => {
              const k = id.toLowerCase() as 'a' | 'b' | 'c' | 'd';
              return {
                id,
                text: {
                  mr: col(r, `option_${k}_mr` as (typeof QUESTION_CSV_COLUMNS)[number]),
                  en: col(r, `option_${k}_en` as (typeof QUESTION_CSV_COLUMNS)[number]),
                },
              };
            }),
            correctOption: correct as OptionId,
            explanation: { mr: col(r, 'explanation_mr'), en: col(r, 'explanation_en') },
            marks: col(r, 'marks'),
            negativeMarks: col(r, 'negative_marks'),
            difficulty: difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase() : '',
            topic: col(r, 'topic'),
          },
          defaults
        )
      );
    } catch (err) {
      errors.push({ row: rowNo, message: (err as Error).message });
    }
  });

  // All-or-nothing: never import half a file
  if (errors.length) return { inserted: 0, errors };
  const inserted = await insertQuestions(quizId, inputs, mode);
  return { inserted, errors: [] as CsvImportError[] };
}

/**
 * Inserts already-validated questions (used by CSV import and AI extraction).
 * Runs in one transaction so a failure never leaves a half-filled quiz.
 */
export async function insertQuestions(quizId: string, inputs: QuestionInput[], mode: 'append' | 'replace') {
  const quiz = await getQuizRow(quizId);
  if (!inputs.length) throw new ValidationError('No questions to add');
  await db.transaction(async (tx) => {
    let start = 0;
    if (mode === 'replace') {
      await tx.delete(QQ).where(eq(QQ.quizSetId, quizId));
    } else {
      const [{ maxPos }] = await tx
        .select({ maxPos: sql<number>`coalesce(max(${QQ.position}), -1)` })
        .from(QQ)
        .where(eq(QQ.quizSetId, quizId));
      start = Number(maxPos) + 1;
    }
    for (let i = 0; i < inputs.length; i += 200) {
      await tx.insert(QQ).values(
        inputs.slice(i, i + 200).map((input, j) => ({
          ...questionValues(quiz, input),
          id: newId('q'),
          quizSetId: quizId,
          position: start + i + j,
        }))
      );
    }
  });
  await recomputeTotals(quizId);
  invalidateQuizzes();
  return inputs.length;
}

export async function exportQuestionsCsv(quizId: string) {
  const { quiz, questions } = await getQuiz(quizId);
  const rows: (string | number)[][] = [[...QUESTION_CSV_COLUMNS]];
  for (const q of questions) {
    const opt = (id: OptionId) => q.options.find((o) => o.id === id)!.text;
    rows.push([
      q.question.mr, q.question.en,
      opt('A').mr, opt('A').en, opt('B').mr, opt('B').en,
      opt('C').mr, opt('C').en, opt('D').mr, opt('D').en,
      q.correctOption, q.explanation.mr, q.explanation.en,
      q.marks, q.negativeMarks, q.difficulty, q.topic,
    ]);
  }
  return { filename: `${quiz.slug}-questions.csv`, csv: toCsv(rows) };
}

export function csvTemplate() {
  return toCsv([
    [...QUESTION_CSV_COLUMNS],
    [
      'भारताचे पहिले राष्ट्रपती कोण होते?', 'Who was the first President of India?',
      'डॉ. राजेंद्र प्रसाद', 'Dr. Rajendra Prasad', 'पं. नेहरू', 'Pt. Nehru',
      'डॉ. आंबेडकर', 'Dr. Ambedkar', 'सरदार पटेल', 'Sardar Patel',
      'A', 'डॉ. राजेंद्र प्रसाद १९५० ते १९६२ राष्ट्रपती होते.', 'Dr. Rajendra Prasad served from 1950 to 1962.',
      2, 0.5, 'Easy', 'Indian Polity',
    ],
  ]);
}

// -------------------------------------------------------------------------
// Analytics
// -------------------------------------------------------------------------

export async function quizAnalytics(quizId: string) {
  await getQuizRow(quizId);
  const [questions, attempts] = await Promise.all([
    db.select().from(QQ).where(eq(QQ.quizSetId, quizId)).orderBy(asc(QQ.position)),
    db
      .select()
      .from(QA)
      .where(and(eq(QA.quizSetId, quizId), eq(QA.status, 'submitted')))
      .orderBy(desc(QA.completedAt))
      .limit(5000),
  ]);

  const n = attempts.length;
  const pct = attempts.map((a) => num(a.percentage));
  const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  pct.forEach((p) => buckets[Math.min(4, Math.floor(Math.max(0, p) / 20))]++);

  const perQuestion = questions.map((q, i) => {
    let attempted = 0;
    let correct = 0;
    const picks: Record<OptionId, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const a of attempts) {
      if (!a.questionOrder.includes(q.id)) continue;
      const sel = a.answers[q.id];
      if (!sel) continue;
      attempted++;
      picks[sel]++;
      if (sel === q.correctOption) correct++;
    }
    const wrongPicks = OPTION_IDS.filter((o) => o !== q.correctOption).sort((x, y) => picks[y] - picks[x]);
    return {
      id: q.id,
      number: i + 1,
      question: q.question.mr || q.question.en,
      topic: q.subject,
      correctOption: q.correctOption,
      attempted,
      correctRate: attempted ? round2((correct / attempted) * 100) : 0,
      skipRate: n ? round2(((n - attempted) / n) * 100) : 0,
      commonWrong: picks[wrongPicks[0]] ? wrongPicks[0] : null,
      picks,
    };
  });

  return {
    summary: {
      attempts: n,
      participants: new Set(attempts.map((a) => a.participantId)).size,
      avgScore: n ? round2(attempts.reduce((s, a) => s + num(a.score), 0) / n) : 0,
      avgPercentage: n ? round2(pct.reduce((s, p) => s + p, 0) / n) : 0,
      highest: n ? Math.max(...pct) : 0,
      passRate: n ? round2((attempts.filter((a) => a.passed).length / n) * 100) : 0,
      avgTimeSeconds: n ? Math.round(attempts.reduce((s, a) => s + a.timeTakenSeconds, 0) / n) : 0,
      late: attempts.filter((a) => a.isLate).length,
      distribution: buckets,
    },
    perQuestion,
    recent: attempts.slice(0, 50).map((a) => ({
      id: a.id,
      name: a.participantName,
      mobile: a.participantMobile,
      email: a.participantEmail,
      address: a.participantAddress,
      score: num(a.score),
      totalMarks: num(a.totalMarks),
      percentage: num(a.percentage),
      correct: a.correctCount,
      wrong: a.wrongCount,
      skipped: a.skippedCount,
      passed: a.passed,
      isLate: a.isLate,
      timeTakenSeconds: a.timeTakenSeconds,
      completedAt: a.completedAt,
    })),
  };
}

export async function resetAttempts(quizId: string) {
  await getQuizRow(quizId);
  const res = await db.delete(QA).where(eq(QA.quizSetId, quizId));
  invalidateQuizzes();
  return { deleted: (res as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0 };
}

export async function attemptsCsv(quizId: string) {
  const quiz = await getQuizRow(quizId);
  const rows = await db
    .select()
    .from(QA)
    .where(and(eq(QA.quizSetId, quizId), eq(QA.status, 'submitted')))
    .orderBy(desc(QA.completedAt));
  return {
    filename: `${quiz.slug}-attempts.csv`,
    csv: toCsv([
      [
        'Attempt', 'Name', 'Mobile', 'Email', 'Address', 'Score', 'Total', 'Percentage', 'Correct', 'Wrong',
        'Skipped', 'Passed', 'Late', 'Time (s)', 'Started', 'Submitted',
      ],
      ...rows.map((a) => [
        a.id, a.participantName, a.participantMobile ?? '', a.participantEmail ?? '', a.participantAddress ?? '',
        num(a.score), num(a.totalMarks), num(a.percentage), a.correctCount, a.wrongCount,
        a.skippedCount, a.passed ? 'yes' : 'no', a.isLate ? 'yes' : 'no', a.timeTakenSeconds,
        a.startedAt.toISOString(), a.completedAt?.toISOString() ?? '',
      ]),
    ]),
  };
}
