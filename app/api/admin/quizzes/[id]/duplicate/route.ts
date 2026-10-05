import { adminRoute } from '@/lib/server/routeHelpers';
import { duplicateQuiz } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

export const POST = adminRoute<{ id: string }>(async (_req, { id }) => ({ item: await duplicateQuiz(id) }), 201);
