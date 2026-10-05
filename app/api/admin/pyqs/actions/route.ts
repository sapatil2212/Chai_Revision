import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { bulkPyqAction } from '@/lib/server/pyq/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Publish, unpublish or delete many questions. Body: { ids: string[], action } */
export const POST = adminRoute(async (req) => {
  const body = await readJson(req);
  return { ok: true, ...(await bulkPyqAction(body.ids, body.action)) };
});
