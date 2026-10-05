import { NextResponse } from 'next/server';
import { getPublishedQuizzes } from '@/lib/server/quiz/common';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';

/** Public list of published quizzes (no questions or answers). */
export async function GET() {
  try {
    return NextResponse.json({ items: await getPublishedQuizzes() });
  } catch (err) {
    return apiError(err);
  }
}
