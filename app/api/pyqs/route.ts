import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { getPublishedPyqs } from '@/lib/server/pyq/common';
import { pyqQueryFromParams } from '@/lib/server/pyq/query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public previous-year questions.
 * Query: ?exam=&year=&subject=&topic=&source=&difficulty=&search=&limit=&offset=
 *
 * Answers and explanations are included on purpose: PYQ practice is open revision,
 * so the browser reveals them when the student taps an option.
 */
export async function GET(req: NextRequest) {
  try {
    const page = await getPublishedPyqs(pyqQueryFromParams(req.nextUrl.searchParams));
    return NextResponse.json(page, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
