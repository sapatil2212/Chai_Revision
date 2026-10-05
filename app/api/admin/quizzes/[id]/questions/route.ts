import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { ValidationError } from '@/lib/server/content';
import { addQuestion, reorderQuestions } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

type P = { id: string };

export const POST = adminRoute<P>(async (req, { id }) => ({ item: await addQuestion(id, await readJson(req)) }), 201);

/** Body: { order: string[] } — every question id of the quiz in the new order. */
export const PUT = adminRoute<P>(async (req, { id }) => {
  const body = await readJson(req);
  if (!Array.isArray(body.order) || !body.order.every((x) => typeof x === 'string')) {
    throw new ValidationError('order must be an array of question ids');
  }
  await reorderQuestions(id, body.order as string[]);
  return { ok: true };
});
