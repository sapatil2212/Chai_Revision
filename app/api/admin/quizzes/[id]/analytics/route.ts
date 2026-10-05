import { adminRoute } from '@/lib/server/routeHelpers';
import { quizAnalytics } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute<{ id: string }>(async (_req, { id }) => quizAnalytics(id));
