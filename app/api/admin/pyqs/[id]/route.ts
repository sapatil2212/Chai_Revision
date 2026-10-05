import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { deletePyq, getPyq, updatePyq } from '@/lib/server/pyq/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type P = { id: string };

export const GET = adminRoute<P>(async (_req, { id }) => getPyq(id));
export const PATCH = adminRoute<P>(async (req, { id }) => updatePyq(id, await readJson(req)));
export const DELETE = adminRoute<P>(async (_req, { id }) => {
  await deletePyq(id);
  return { ok: true };
});
