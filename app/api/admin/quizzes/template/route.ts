import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { csvTemplate } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';

/** Downloadable CSV template for bulk question import. */
export const GET = adminRoute(async () => csvResponse('quiz-questions-template.csv', csvTemplate()));
