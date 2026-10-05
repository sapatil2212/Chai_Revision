import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { ValidationError } from '@/lib/server/content';
import { importQuestionsCsv } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

const MAX_CSV_BYTES = 5 * 1024 * 1024;

/**
 * Body: { csv: string, mode: 'append' | 'replace' }
 * All-or-nothing: if any row is invalid nothing is imported and every row error is returned.
 */
export const POST = adminRoute<{ id: string }>(async (req, { id }) => {
  const body = await readJson(req);
  if (typeof body.csv !== 'string' || !body.csv.trim()) throw new ValidationError('csv is required');
  if (Buffer.byteLength(body.csv) > MAX_CSV_BYTES) throw new ValidationError('CSV file is too large (max 5 MB)');
  const mode = body.mode === 'replace' ? 'replace' : 'append';
  const result = await importQuestionsCsv(id, body.csv, mode);
  if (result.errors.length) {
    return NextResponse.json(
      { error: `${result.errors.length} row(s) have problems. Nothing was imported.`, ...result },
      { status: 400 }
    );
  }
  return { ok: true, ...result };
});
