import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { ValidationError } from '@/lib/server/content';
import { getQuiz, insertQuestions } from '@/lib/server/quiz/admin';
import { parseQuestionInput } from '@/lib/server/quiz/common';

export const runtime = 'nodejs';

const MAX_BULK = 200;

/**
 * Adds many questions at once (used by the AI review screen).
 * Body: { questions: [...], mode?: 'append' | 'replace' }
 * Every question goes through the same validation as manual entry; one bad row rejects the batch.
 */
export const POST = adminRoute<{ id: string }>(async (req, { id }) => {
  const body = await readJson(req);
  const list = Array.isArray(body.questions) ? body.questions : null;
  if (!list?.length) throw new ValidationError('questions must be a non-empty array');
  if (list.length > MAX_BULK) throw new ValidationError(`At most ${MAX_BULK} questions can be added at once`);

  const { quiz } = await getQuiz(id);
  const defaults = { marks: quiz.defaultMarks, negativeMarks: quiz.defaultNegativeMarks };

  const inputs = list.map((q, i) => {
    try {
      return parseQuestionInput(q as Record<string, unknown>, defaults);
    } catch (err) {
      throw new ValidationError(`Question ${i + 1}: ${(err as Error).message}`);
    }
  });

  const mode = body.mode === 'replace' ? 'replace' : 'append';
  return { ok: true, inserted: await insertQuestions(id, inputs, mode) };
}, 201);
