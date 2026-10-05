import { adminRoute } from '@/lib/server/routeHelpers';
import { duplicatePyq } from '@/lib/server/pyq/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Copies a question as a draft so it can be edited without touching the original. */
export const POST = adminRoute<{ id: string }>(async (_req, { id }) => duplicatePyq(id), 201);
