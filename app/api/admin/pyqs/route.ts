import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { createPyq, exportPyqsCsv, listPyqs } from '@/lib/server/pyq/admin';
import { pyqQueryFromParams } from '@/lib/server/pyq/query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Previous-year questions for the admin.
 * Query: ?exam=&year=&subject=&topic=&source=&difficulty=&search=&limit=&offset=&format=csv
 */
export const GET = adminRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const query = pyqQueryFromParams(sp);
  if (sp.get('format') === 'csv') {
    const { filename, csv } = await exportPyqsCsv(query);
    return csvResponse(filename, csv);
  }
  return listPyqs(query);
});

export const POST = adminRoute(async (req) => createPyq(await readJson(req)), 201);
