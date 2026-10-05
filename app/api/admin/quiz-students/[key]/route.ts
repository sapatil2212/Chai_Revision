import { adminRoute } from '@/lib/server/routeHelpers';
import { getQuizStudent } from '@/lib/server/quiz/students';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type P = { key: string };

/** One student (by mobile, or `pid:<browser id>`) with their full attempt history. */
export const GET = adminRoute<P>(async (_req, { key }) => getQuizStudent(decodeURIComponent(key)));
