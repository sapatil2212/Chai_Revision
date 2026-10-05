import { NextResponse } from 'next/server';
import { apiError } from '@/lib/server/apiErrors';
import { getPyqFilterOptions } from '@/lib/server/pyq/common';

export const runtime = 'nodejs';

/** Exam / year / subject / topic choices that actually have published questions. */
export async function GET() {
  try {
    return NextResponse.json(await getPyqFilterOptions());
  } catch (err) {
    return apiError(err);
  }
}
