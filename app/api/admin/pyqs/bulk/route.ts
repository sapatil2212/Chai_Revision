import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { insertPyqs } from '@/lib/server/pyq/admin';
import { ValidationError } from '@/lib/server/content';
import { parsePyqInput } from '@/lib/server/pyq/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Adds many questions at once (used by the AI review step).
 * Body: { questions: [...] } — every question goes through the same validator as the
 * manual form, so a doctored payload cannot write a malformed question.
 */
export const POST = adminRoute(async (req) => {
  const body = await readJson(req);
  const raw = Array.isArray(body.questions) ? (body.questions as Record<string, unknown>[]) : [];
  if (!raw.length) throw new ValidationError('No questions to add');

  const inputs = raw.map((q, i) => {
    try {
      return parsePyqInput(q);
    } catch (err) {
      throw new ValidationError(`Question ${i + 1}: ${(err as Error).message}`);
    }
  });
  return { ok: true, ...(await insertPyqs(inputs)) };
}, 201);
