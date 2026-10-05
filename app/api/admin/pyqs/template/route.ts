import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { pyqCsvTemplate } from '@/lib/server/pyq/admin';

export const runtime = 'nodejs';

/** Downloadable CSV template with one filled-in example row. */
export const GET = adminRoute(async () => csvResponse('pyq-template.csv', pyqCsvTemplate()));
