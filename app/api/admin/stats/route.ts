import { adminRoute } from '@/lib/server/routeHelpers';
import { dashboardStats } from '@/lib/server/adminStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Live counts, 7-day trend, recent activity and upcoming items for the dashboard. */
export const GET = adminRoute(async () => dashboardStats());
