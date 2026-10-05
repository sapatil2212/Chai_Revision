import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { exportQuestionsCsv } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Questions as CSV (same format as the import template). */
export const GET = adminRoute<{ id: string }>(async (_req, { id }) => {
  const { filename, csv } = await exportQuestionsCsv(id);
  return csvResponse(filename, csv);
});
