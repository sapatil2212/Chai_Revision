import { adminRoute } from '@/lib/server/routeHelpers';
import { duplicateQuestion } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

export const POST = adminRoute<{ id: string; qid: string }>(
  async (_req, { id, qid }) => ({ item: await duplicateQuestion(id, qid) }),
  201
);
