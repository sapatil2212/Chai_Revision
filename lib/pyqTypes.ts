// Shared types for the previous-year question (PYQ) bank. Client-safe.
import type { OptionId } from './quizTypes';

export type { OptionId };
export { OPTION_IDS } from './quizTypes';

/** PYQ content is trilingual: Marathi, English and Hindi. */
export type L3 = { mr: string; en: string; hi: string };

export type PyqDifficulty = 'Easy' | 'Medium' | 'Hard';

export const PYQ_YEAR_MIN = 1990;
export const pyqYearMax = () => new Date().getFullYear() + 1;

/**
 * A previous-year question as served to students.
 *
 * Unlike a graded quiz, the correct answer and explanation ARE sent to the browser:
 * PYQ practice is open revision, not a scored test, and students reveal the answer
 * on tap. Nothing here is secret.
 */
export interface PyqQuestion {
  id: string;
  exam: string;
  year: number;
  subject: string;
  topic: string;
  /** Paper the question came from, e.g. "MPSC Rajyaseva Prelims 2024 Paper 1". */
  source: string | null;
  questionNumber: number | null;
  question: L3;
  options: { id: OptionId; text: L3 }[];
  correctOption: OptionId;
  explanation: L3;
  difficulty: PyqDifficulty;
}

/** Admin view adds the publish flag, ordering and timestamps. */
export interface AdminPyq extends PyqQuestion {
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Filter choices derived from the questions that actually exist. */
export interface PyqFilterOptions {
  exams: string[];
  years: number[];
  subjects: string[];
  topics: string[];
  sources: string[];
  total: number;
}

export interface PyqPage<T = PyqQuestion> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Columns for the PYQ CSV import/export template. */
export const PYQ_CSV_COLUMNS = [
  'exam', 'year', 'subject', 'topic', 'source', 'question_number',
  'question_mr', 'question_en', 'question_hi',
  'option_a_mr', 'option_a_en', 'option_a_hi',
  'option_b_mr', 'option_b_en', 'option_b_hi',
  'option_c_mr', 'option_c_en', 'option_c_hi',
  'option_d_mr', 'option_d_en', 'option_d_hi',
  'correct_option',
  'explanation_mr', 'explanation_en', 'explanation_hi',
  'difficulty',
] as const;
