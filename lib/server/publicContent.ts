import { getPublishedExamUpdates, getPublishedMaterials } from './content';
import { getPublishedQuizzes } from './quiz/common';
import type { ExamUpdate, Product } from '@/lib/types';
import type { QuizSummary } from '@/lib/quizTypes';

export interface PublicContent {
  materials?: Product[];
  examUpdates?: ExamUpdate[];
  quizzes?: QuizSummary[];
}

/**
 * Loads catalog content for public pages. If the database is unreachable, returns
 * undefined fields so the client falls back to bundled static data instead of crashing.
 */
export async function loadPublicContent(): Promise<PublicContent> {
  try {
    const [materials, examUpdates, quizzes] = await Promise.all([
      getPublishedMaterials(),
      getPublishedExamUpdates(),
      getPublishedQuizzes(),
    ]);
    return { materials, examUpdates, quizzes };
  } catch (err) {
    console.error('[content] DB unavailable, using static fallback:', (err as Error).message);
    return {};
  }
}
