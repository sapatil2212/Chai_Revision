import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { attemptsCsv, resetAttempts } from '@/lib/server/quiz/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type P = { id: string };

/** All submitted attempts as CSV. */
export const GET = adminRoute<P>(async (_req, { id }) => {
  const { filename, csv } = await attemptsCsv(id);
  return csvResponse(filename, csv);
});

/** Deletes every attempt for this quiz (resets leaderboard and analytics). */
export const DELETE = adminRoute<P>(async (_req, { id }) => ({ ok: true, ...(await resetAttempts(id)) }));
