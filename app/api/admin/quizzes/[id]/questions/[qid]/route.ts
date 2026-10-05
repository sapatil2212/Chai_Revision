import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { deleteQuestion, updateQuestion } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

type P = { id: string; qid: string };

export const PATCH = adminRoute<P>(async (req, { id, qid }) => ({ item: await updateQuestion(id, qid, await readJson(req)) }));
export const DELETE = adminRoute<P>(async (_req, { id, qid }) => ({ ok: true, ...(await deleteQuestion(id, qid)) }));
