// Shared PYQ helpers: row mappers, input validation, filter options and the
// cached public query. Used by both the admin and public layers.
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db, schema } from '@/db';
import { ValidationError, validators as v } from '../content';
import { EXAM_OPTIONS, QUESTION_DIFFICULTY_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import {
  OPTION_IDS,
  PYQ_YEAR_MIN,
  pyqYearMax,
  type AdminPyq,
  type L3,
  type OptionId,
  type PyqDifficulty,
  type PyqFilterOptions,
  type PyqQuestion,
} from '@/lib/pyqTypes';

export const P = schema.pyqs;
export type PyqRow = typeof P.$inferSelect;

export const PYQ_CACHE_TAG = 'pyqs';
export const invalidatePyqs = () => revalidateTag(PYQ_CACHE_TAG);

type Obj = Record<string, unknown>;

/** Fills missing languages so the UI never shows a blank question. */
export const l3 = (x: Partial<L3> | null | undefined): L3 => {
  const en = x?.en?.trim() || x?.mr?.trim() || x?.hi?.trim() || '';
  const mr = x?.mr?.trim() || en;
  return { mr, en, hi: x?.hi?.trim() || mr };
};

// -------------------------------------------------------------------------
// Mappers
// -------------------------------------------------------------------------

export function toPyq(r: PyqRow): PyqQuestion {
  return {
    id: r.id,
    exam: r.exam,
    year: r.year,
    subject: r.subject,
    topic: r.topic,
    source: r.source,
    questionNumber: r.questionNumber,
    question: l3(r.question),
    // Always emit all four options in A-D order, even if a row is malformed
    options: OPTION_IDS.map((id) => ({ id, text: l3(r.options.find((o) => o.id === id)?.text) })),
    correctOption: r.correctOption,
    explanation: l3(r.explanation),
    difficulty: r.difficulty as PyqDifficulty,
  };
}

export const toAdminPyq = (r: PyqRow): AdminPyq => ({
  ...toPyq(r),
  isPublished: r.isPublished,
  sortOrder: r.sortOrder,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

/**
 * Validates one PYQ payload. Shared by the manual form, CSV import and AI import,
 * so no path can write a question that the others would reject.
 */
export function parsePyqInput(body: Obj) {
  const question = v.localized(body, 'question', { required: true, max: 4000 })!;

  const rawOptions = Array.isArray(body.options) ? (body.options as Obj[]) : [];
  const options = OPTION_IDS.map((id) => {
    const found = rawOptions.find((o) => o && String(o.id).toUpperCase() === id);
    const text = found ? v.localized(found, 'text', { max: 1000 }) : null;
    if (!text) throw new ValidationError(`Option ${id} needs text in at least one language`);
    return { id, text };
  });

  const subject = v.oneOf(body, 'subject', SUBJECT_OPTIONS);
  const explanation = v.localized(body, 'explanation', { max: 6000 });

  return {
    exam: v.oneOf(body, 'exam', EXAM_OPTIONS),
    year: v.int(body, 'year', { min: PYQ_YEAR_MIN, max: pyqYearMax() }),
    subject,
    // Topic keeps the question findable; fall back to the subject when blank
    topic: v.str(body, 'topic', { max: 191 }) || subject,
    source: v.str(body, 'source', { max: 191 }) || null,
    questionNumber: body.questionNumber === undefined || body.questionNumber === null || body.questionNumber === ''
      ? null
      : v.int(body, 'questionNumber', { min: 1, max: 1000 }),
    question,
    options,
    correctOption: v.oneOf(body, 'correctOption', OPTION_IDS) as OptionId,
    explanation: explanation ?? { mr: '', en: '', hi: '' },
    difficulty: v.oneOf(body, 'difficulty', QUESTION_DIFFICULTY_OPTIONS, 'Medium') as PyqDifficulty,
    isPublished: body.isPublished === undefined ? true : v.bool(body, 'isPublished'),
    sortOrder: v.int(body, 'sortOrder', { min: -100000, max: 100000, fallback: 0 }),
  };
}
export type PyqInput = ReturnType<typeof parsePyqInput>;

// -------------------------------------------------------------------------
// Query building (shared by admin list and public list)
// -------------------------------------------------------------------------

export interface PyqQuery {
  exam?: string;
  year?: number;
  subject?: string;
  topic?: string;
  source?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const ALL = (s: string | undefined) => !s || s === 'All';

/** Matches the search term against question text and topic in any language. */
function searchCondition(term: string): SQL {
  const like = `%${term}%`;
  return sql`(
    ${P.topic} LIKE ${like}
    OR COALESCE(${P.source}, '') LIKE ${like}
    OR JSON_UNQUOTE(JSON_EXTRACT(${P.question}, '$.mr')) LIKE ${like}
    OR JSON_UNQUOTE(JSON_EXTRACT(${P.question}, '$.en')) LIKE ${like}
    OR JSON_UNQUOTE(JSON_EXTRACT(${P.question}, '$.hi')) LIKE ${like}
  )`;
}

export function pyqConditions(q: PyqQuery, publishedOnly: boolean): SQL[] {
  const where: SQL[] = [];
  if (publishedOnly) where.push(sql`${P.isPublished} = true`);
  if (!ALL(q.exam)) where.push(sql`${P.exam} = ${q.exam}`);
  if (q.year && Number.isInteger(q.year)) where.push(sql`${P.year} = ${q.year}`);
  if (!ALL(q.subject)) where.push(sql`${P.subject} = ${q.subject}`);
  if (!ALL(q.topic)) where.push(sql`${P.topic} = ${q.topic}`);
  if (!ALL(q.source)) where.push(sql`${P.source} = ${q.source}`);
  if (!ALL(q.difficulty)) where.push(sql`${P.difficulty} = ${q.difficulty}`);
  const term = (q.search || '').trim().slice(0, 100);
  if (term) where.push(searchCondition(term));
  return where;
}

/** Newest papers first, then the question's position in its paper (unnumbered last). */
const PYQ_ORDER = [
  asc(P.sortOrder),
  desc(P.year),
  sql`coalesce(${P.questionNumber}, 100000) asc`,
  asc(P.id),
];

/** `maxLimit` is raised by the CSV export, which needs more than one page. */
export async function queryPyqs(q: PyqQuery, publishedOnly: boolean, maxLimit = 100) {
  const where = pyqConditions(q, publishedOnly);
  const filter = where.length ? and(...where) : undefined;
  const limit = Math.min(maxLimit, Math.max(1, q.limit || 20));
  const offset = Math.max(0, q.offset || 0);

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(P).where(filter).orderBy(...PYQ_ORDER).limit(limit).offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(P).where(filter),
  ]);
  return { rows, total: Number(n), limit, offset };
}

// -------------------------------------------------------------------------
// Filter options
// -------------------------------------------------------------------------

async function filterOptions(publishedOnly: boolean): Promise<PyqFilterOptions> {
  const where = publishedOnly ? eq(P.isPublished, true) : undefined;
  const rows = await db
    .select({ exam: P.exam, year: P.year, subject: P.subject, topic: P.topic, source: P.source })
    .from(P)
    .where(where);

  const uniq = <T>(list: (T | null)[]) => [...new Set(list.filter((x): x is T => x !== null && x !== ''))];
  return {
    exams: uniq(rows.map((r) => r.exam)).sort(),
    years: uniq(rows.map((r) => r.year)).sort((a, b) => b - a),
    subjects: uniq(rows.map((r) => r.subject)).sort(),
    topics: uniq(rows.map((r) => r.topic)).sort((a, b) => a.localeCompare(b, 'mr')),
    sources: uniq(rows.map((r) => r.source)).sort(),
    total: rows.length,
  };
}

export const getPyqFilterOptions = unstable_cache(() => filterOptions(true), ['public-pyq-filters'], {
  tags: [PYQ_CACHE_TAG],
  revalidate: 300,
});

export const getAdminPyqFilterOptions = () => filterOptions(false);

// -------------------------------------------------------------------------
// Public list
// -------------------------------------------------------------------------

/**
 * Published questions for a filter/search combination.
 * Deliberately uncached: search terms are unbounded, so caching per query would
 * fill the data cache with single-use entries. The query is index-backed instead.
 */
export async function getPublishedPyqs(q: PyqQuery) {
  const { rows, total, limit, offset } = await queryPyqs(q, true);
  return { items: rows.map(toPyq), total, limit, offset };
}
