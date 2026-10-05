import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { applyMarksToAll } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

/** Body: { marks: number, negativeMarks: number } — applied to every question and saved as the quiz default. */
export const POST = adminRoute<{ id: string }>(async (req, { id }) => ({ ok: true, ...(await applyMarksToAll(id, await readJson(req))) }));
