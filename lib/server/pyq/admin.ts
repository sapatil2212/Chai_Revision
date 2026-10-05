// Admin-side PYQ management: CRUD, bulk insert, CSV import/export and stats.
import { randomUUID } from 'crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { NotFoundError, ValidationError } from '../content';
import { parseCsv, toCsv } from '../csv';
import { OPTION_IDS, PYQ_CSV_COLUMNS, type OptionId } from '@/lib/pyqTypes';
import {
  P,
  getAdminPyqFilterOptions,
  invalidatePyqs,
  parsePyqInput,
  queryPyqs,
  toAdminPyq,
  type PyqInput,
  type PyqQuery,
} from './common';

const newId = () => `pyq-${randomUUID().replace(/-/g, '').slice(0, 12)}`;

/** Max rows accepted in one CSV / AI import. */
export const PYQ_IMPORT_LIMIT = 500;
/** Max rows written to a CSV export in one request. */
export const PYQ_EXPORT_LIMIT = 5000;

async function getRow(id: string) {
  const [row] = await db.select().from(P).where(eq(P.id, id));
  if (!row) throw new NotFoundError('Question not found');
  return row;
}

// -------------------------------------------------------------------------
// List & stats
// -------------------------------------------------------------------------

export async function pyqStats() {
  const [rows, [totals]] = await Promise.all([
    db
      .select({ year: P.year, exam: P.exam, n: sql<number>`count(*)` })
      .from(P)
      .groupBy(P.year, P.exam),
    db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when ${P.isPublished} then 1 else 0 end)`,
        years: sql<number>`count(distinct ${P.year})`,
        exams: sql<number>`count(distinct ${P.exam})`,
        subjects: sql<number>`count(distinct ${P.subject})`,
      })
      .from(P),
  ]);
  const total = Number(totals?.total || 0);
  const published = Number(totals?.published || 0);
  return {
    total,
    published,
    drafts: total - published,
    years: Number(totals?.years || 0),
    exams: Number(totals?.exams || 0),
    subjects: Number(totals?.subjects || 0),
    /** Question count per year, newest first — drives the admin overview. */
    byYear: [...new Set(rows.map((r) => r.year))]
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        count: rows.filter((r) => r.year === year).reduce((n, r) => n + Number(r.n), 0),
      })),
  };
}

export async function listPyqs(q: PyqQuery) {
  const [{ rows, total, limit, offset }, filters, stats] = await Promise.all([
    queryPyqs(q, false),
    getAdminPyqFilterOptions(),
    pyqStats(),
  ]);
  return { items: rows.map(toAdminPyq), total, limit, offset, filters, stats };
}

export async function getPyq(id: string) {
  return { item: toAdminPyq(await getRow(id)) };
}

// -------------------------------------------------------------------------
// Writes
// -------------------------------------------------------------------------

export async function createPyq(body: Record<string, unknown>) {
  const input = parsePyqInput(body);
  const id = newId();
  await db.insert(P).values({ ...input, id });
  invalidatePyqs();
  return { item: toAdminPyq(await getRow(id)) };
}

export async function updatePyq(id: string, patch: Record<string, unknown>) {
  const existing = toAdminPyq(await getRow(id));
  // Validate the merged object so a partial patch still has to satisfy every rule
  const input = parsePyqInput({ ...existing, ...patch });
  await db.update(P).set(input).where(eq(P.id, id));
  invalidatePyqs();
  return { item: toAdminPyq(await getRow(id)) };
}

export async function deletePyq(id: string) {
  await getRow(id);
  await db.delete(P).where(eq(P.id, id));
  invalidatePyqs();
}

export async function duplicatePyq(id: string) {
  const src = await getRow(id);
  const copyId = newId();
  const { createdAt: _c, updatedAt: _u, ...rest } = src;
  void _c;
  void _u;
  await db.insert(P).values({ ...rest, id: copyId, isPublished: false });
  invalidatePyqs();
  return { item: toAdminPyq(await getRow(copyId)) };
}

/** Publish / unpublish / delete many questions at once. */
export async function bulkPyqAction(ids: unknown, action: unknown) {
  const list = (Array.isArray(ids) ? ids : []).filter((x): x is string => typeof x === 'string' && !!x).slice(0, PYQ_IMPORT_LIMIT);
  if (!list.length) throw new ValidationError('Select at least one question');
  if (action !== 'publish' && action !== 'unpublish' && action !== 'delete') {
    throw new ValidationError('action must be publish, unpublish or delete');
  }

  let affected = 0;
  await db.transaction(async (tx) => {
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const res =
        action === 'delete'
          ? await tx.delete(P).where(inArray(P.id, chunk))
          : await tx.update(P).set({ isPublished: action === 'publish' }).where(inArray(P.id, chunk));
      affected += (res as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
    }
  });
  invalidatePyqs();
  return { action, affected };
}

/**
 * Inserts already-validated questions (CSV import and AI import).
 * One transaction, so a failure never leaves half a paper in the bank.
 */
export async function insertPyqs(inputs: PyqInput[]) {
  if (!inputs.length) throw new ValidationError('No questions to add');
  if (inputs.length > PYQ_IMPORT_LIMIT) throw new ValidationError(`At most ${PYQ_IMPORT_LIMIT} questions can be imported at once`);
  await db.transaction(async (tx) => {
    for (let i = 0; i < inputs.length; i += 100) {
      await tx.insert(P).values(inputs.slice(i, i + 100).map((input) => ({ ...input, id: newId() })));
    }
  });
  invalidatePyqs();
  return { inserted: inputs.length };
}

// -------------------------------------------------------------------------
// CSV import / export
// -------------------------------------------------------------------------

export type PyqCsvError = { row: number; message: string };
type Col = (typeof PYQ_CSV_COLUMNS)[number];

export async function importPyqsCsv(csv: string) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new ValidationError('The CSV needs a header row and at least one question row');
  if (rows.length > PYQ_IMPORT_LIMIT + 1) throw new ValidationError(`At most ${PYQ_IMPORT_LIMIT} questions can be imported at once`);

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/^\ufeff/, ''));
  const missing = (['exam', 'year', 'subject', 'correct_option'] as Col[]).filter((c) => !header.includes(c));
  if (missing.length) {
    throw new ValidationError(`Missing column(s): ${missing.join(', ')}. Download the template for the exact format.`);
  }
  const col = (r: string[], name: Col) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? '').trim() : '';
  };

  const errors: PyqCsvError[] = [];
  const inputs: PyqInput[] = [];
  rows.slice(1).forEach((r, idx) => {
    const rowNo = idx + 2; // spreadsheet row number (header = row 1)
    if (r.every((cell) => !cell.trim())) return; // skip blank lines
    try {
      let correct = col(r, 'correct_option').toUpperCase();
      if (/^[1-4]$/.test(correct)) correct = OPTION_IDS[Number(correct) - 1]; // allow 1-4 as well as A-D
      const difficulty = col(r, 'difficulty');
      inputs.push(
        parsePyqInput({
          exam: col(r, 'exam'),
          year: col(r, 'year'),
          subject: col(r, 'subject'),
          topic: col(r, 'topic'),
          source: col(r, 'source'),
          questionNumber: col(r, 'question_number'),
          question: { mr: col(r, 'question_mr'), en: col(r, 'question_en'), hi: col(r, 'question_hi') },
          options: OPTION_IDS.map((id) => {
            const k = id.toLowerCase();
            return {
              id,
              text: {
                mr: col(r, `option_${k}_mr` as Col),
                en: col(r, `option_${k}_en` as Col),
                hi: col(r, `option_${k}_hi` as Col),
              },
            };
          }),
          correctOption: correct as OptionId,
          explanation: {
            mr: col(r, 'explanation_mr'),
            en: col(r, 'explanation_en'),
            hi: col(r, 'explanation_hi'),
          },
          difficulty: difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase() : '',
        })
      );
    } catch (err) {
      errors.push({ row: rowNo, message: (err as Error).message });
    }
  });

  // All-or-nothing: never import half a file
  if (errors.length) return { inserted: 0, errors };
  const { inserted } = await insertPyqs(inputs);
  return { inserted, errors: [] as PyqCsvError[] };
}

/** Exports the current filter selection (not just one page). */
export async function exportPyqsCsv(q: PyqQuery) {
  const { rows } = await queryPyqs({ ...q, limit: PYQ_EXPORT_LIMIT, offset: 0 }, false, PYQ_EXPORT_LIMIT);
  const body = rows.map(toAdminPyq).map((p) => {
    const opt = (id: OptionId) => p.options.find((o) => o.id === id)!.text;
    return [
      p.exam, p.year, p.subject, p.topic, p.source ?? '', p.questionNumber ?? '',
      p.question.mr, p.question.en, p.question.hi,
      opt('A').mr, opt('A').en, opt('A').hi,
      opt('B').mr, opt('B').en, opt('B').hi,
      opt('C').mr, opt('C').en, opt('C').hi,
      opt('D').mr, opt('D').en, opt('D').hi,
      p.correctOption,
      p.explanation.mr, p.explanation.en, p.explanation.hi,
      p.difficulty,
    ];
  });
  return { filename: 'pyqs.csv', csv: toCsv([[...PYQ_CSV_COLUMNS], ...body]) };
}

export function pyqCsvTemplate() {
  return toCsv([
    [...PYQ_CSV_COLUMNS],
    [
      'MPSC', 2024, 'Polity & Constitution', 'Fundamental Rights', 'MPSC Rajyaseva Prelims 2024 Paper 1', 12,
      'भारतीय राज्यघटनेच्या कोणत्या कलमाला डॉ. आंबेडकरांनी "राज्यघटनेचा आत्मा" म्हटले?',
      'Which Article did Dr. Ambedkar call the "heart and soul of the Constitution"?',
      'डॉ. आंबेडकर ने संविधान के किस अनुच्छेद को "संविधान की आत्मा" कहा?',
      'कलम १४', 'Article 14', 'अनुच्छेद 14',
      'कलम ३२', 'Article 32', 'अनुच्छेद 32',
      'कलम १९', 'Article 19', 'अनुच्छेद 19',
      'कलम २१', 'Article 21', 'अनुच्छेद 21',
      'B',
      'कलम ३२ हे घटनात्मक उपायांचा हक्क देते, म्हणून त्याला राज्यघटनेचा आत्मा म्हटले जाते.',
      'Article 32 provides the right to constitutional remedies, which is why it is called the heart and soul of the Constitution.',
      'अनुच्छेद 32 संवैधानिक उपचारों का अधिकार देता है।',
      'Medium',
    ],
  ]);
}
