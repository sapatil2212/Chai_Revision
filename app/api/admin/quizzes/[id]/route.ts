import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { deleteQuiz, getQuiz, updateQuiz } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type P = { id: string };

/** Quiz settings + all questions (with answers — admin only). */
export const GET = adminRoute<P>(async (_req, { id }) => getQuiz(id));
export const PATCH = adminRoute<P>(async (req, { id }) => ({ item: await updateQuiz(id, await readJson(req)) }));
/** Deletes the quiz, its questions, attempts and question images. */
export const DELETE = adminRoute<P>(async (_req, { id }) => {
  await deleteQuiz(id);
  return { ok: true };
});
