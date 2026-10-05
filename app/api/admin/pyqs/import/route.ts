import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { importPyqsCsv } from '@/lib/server/pyq/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { csv }. Import is all-or-nothing: if any row is invalid nothing is written
 * and the row numbers are returned (400) so the admin can fix the file.
 */
export const POST = adminRoute(async (req) => {
  const { csv } = await readJson(req);
  if (typeof csv !== 'string' || !csv.trim()) {
    return NextResponse.json({ error: 'Paste or upload a CSV file first.' }, { status: 400 });
  }
  const result = await importPyqsCsv(csv);
  return result.errors.length
    ? NextResponse.json(result, { status: 400 })
    : NextResponse.json({ ok: true, ...result });
});
