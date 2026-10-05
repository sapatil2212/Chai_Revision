import { adminRoute } from '@/lib/server/routeHelpers';
import { readJson } from '@/lib/server/apiErrors';
import { createQuiz, listQuizzes } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute(async () => ({ items: await listQuizzes() }));
export const POST = adminRoute(async (req) => ({ item: await createQuiz(await readJson(req)) }), 201);
