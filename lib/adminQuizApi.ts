// Client helpers for the admin quiz APIs (auth via the HttpOnly admin session cookie).
import { request } from './adminApi';
import type { L2, OptionId, QuestionDifficulty, QuizSummary } from './quizTypes';

export type AdminQuizStats = {
  questions: number;
  attempts: number;
  participants: number;
  avgPercentage: number;
  passRate: number;
};

export type AdminQuiz = Omit<QuizSummary, 'instructions'> & {
  instructions: L2;
  isPublished: boolean;
  sortOrder: number;
  defaultMarks: number;
  defaultNegativeMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdAt: string;
  updatedAt: string;
  stats: AdminQuizStats;
};

export type AdminQuestion = {
  id: string;
  position: number;
  topic: string;
  difficulty: QuestionDifficulty;
  question: L2;
  options: { id: OptionId; text: L2 }[];
  correctOption: OptionId;
  explanation: L2;
  marks: number;
  negativeMarks: number;
  image: string | null;
};

export type QuizAnalytics = {
  summary: {
    attempts: number;
    participants: number;
    avgScore: number;
    avgPercentage: number;
    highest: number;
    passRate: number;
    avgTimeSeconds: number;
    late: number;
    distribution: number[];
  };
  perQuestion: {
    id: string;
    number: number;
    question: string;
    topic: string;
    correctOption: OptionId;
    attempted: number;
    correctRate: number;
    skipRate: number;
    commonWrong: OptionId | null;
    picks: Record<OptionId, number>;
  }[];
  recent: {
    id: number;
    name: string;
    mobile: string | null;
    email: string | null;
    address: string | null;
    score: number;
    totalMarks: number;
    percentage: number;
    correct: number;
    wrong: number;
    skipped: number;
    passed: boolean;
    isLate: boolean;
    timeTakenSeconds: number;
    completedAt: string;
  }[];
};

export type CsvImportResult = { ok?: true; inserted: number; errors: { row: number; message: string }[] };

export type AiMode = 'metadata' | 'questions' | 'both';

export type AiQuizDraft = {
  title: L2;
  description: L2;
  instructions: L2;
  exam: string;
  subject: string;
  difficulty: string;
  durationMinutes: number;
  passPercentage: number;
  defaultMarks: number;
  defaultNegativeMarks: number;
  badge: string;
};

export type AiQuestionDraft = {
  question: L2;
  options: { id: OptionId; text: L2 }[];
  correctOption: OptionId;
  explanation: L2;
  difficulty: string;
  topic: string;
  marks?: number;
  negativeMarks?: number;
};

export type AiExtractResult = {
  quiz: AiQuizDraft | null;
  questions: AiQuestionDraft[];
  warnings: string[];
  meta: { fileName: string; kind: string; found: number; skipped: number; model: string };
};

const q = (id: string) => `/api/admin/quizzes/${encodeURIComponent(id)}`;
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const quizAdminApi = {
  list: () => request<{ items: AdminQuiz[] }>('/api/admin/quizzes'),
  create: (body: Record<string, unknown>) => request<{ item: AdminQuiz }>('/api/admin/quizzes', json('POST', body)),
  get: (id: string) => request<{ quiz: AdminQuiz; questions: AdminQuestion[] }>(q(id)),
  update: (id: string, body: Record<string, unknown>) => request<{ item: AdminQuiz }>(q(id), json('PATCH', body)),
  remove: (id: string) => request<{ ok: true }>(q(id), json('DELETE')),
  duplicate: (id: string) => request<{ item: AdminQuiz }>(`${q(id)}/duplicate`, json('POST')),

  addQuestion: (id: string, body: Record<string, unknown>) =>
    request<{ item: AdminQuestion }>(`${q(id)}/questions`, json('POST', body)),
  updateQuestion: (id: string, qid: string, body: Record<string, unknown>) =>
    request<{ item: AdminQuestion }>(`${q(id)}/questions/${encodeURIComponent(qid)}`, json('PATCH', body)),
  deleteQuestion: (id: string, qid: string) =>
    request<{ ok: true; remaining: number; unpublished: boolean }>(`${q(id)}/questions/${encodeURIComponent(qid)}`, json('DELETE')),
  duplicateQuestion: (id: string, qid: string) =>
    request<{ item: AdminQuestion }>(`${q(id)}/questions/${encodeURIComponent(qid)}/duplicate`, json('POST')),
  reorder: (id: string, order: string[]) => request<{ ok: true }>(`${q(id)}/questions`, json('PUT', { order })),
  applyMarks: (id: string, marks: number, negativeMarks: number) =>
    request<{ ok: true; updated: number }>(`${q(id)}/marks`, json('POST', { marks, negativeMarks })),

  /** Resolves with errors (does not throw) when rows are invalid so the UI can list them. */
  importCsv: async (id: string, csv: string, mode: 'append' | 'replace'): Promise<CsvImportResult> => {
    const res = await fetch(`${q(id)}/import`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, mode }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok || Array.isArray(data.errors)) return { inserted: data.inserted ?? 0, errors: data.errors ?? [] };
    const err = new Error(data.error || `Import failed (${res.status})`) as Error & { status: number };
    err.status = res.status;
    throw err;
  },

  /** Adds already-reviewed questions (AI flow). */
  addQuestionsBulk: (id: string, questions: Record<string, unknown>[], mode: 'append' | 'replace' = 'append') =>
    request<{ ok: true; inserted: number }>(`${q(id)}/questions/bulk`, json('POST', { questions, mode })),

  /** Reads a document with Gemini and returns a suggested quiz + questions (nothing saved). */
  aiExtract: async (file: File, opts: { mode: AiMode; limit?: number; hint?: string; marks?: number; negativeMarks?: number }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('mode', opts.mode);
    if (opts.limit) form.append('limit', String(opts.limit));
    if (opts.hint) form.append('hint', opts.hint);
    if (opts.marks !== undefined) form.append('marks', String(opts.marks));
    if (opts.negativeMarks !== undefined) form.append('negativeMarks', String(opts.negativeMarks));
    return request<AiExtractResult>('/api/admin/quizzes/ai-extract', { method: 'POST', body: form });
  },

  analytics: (id: string) => request<QuizAnalytics>(`${q(id)}/analytics`),
  resetAttempts: (id: string) => request<{ ok: true; deleted: number }>(`${q(id)}/attempts`, json('DELETE')),

  // Plain links (GET with the admin cookie) for file downloads
  exportUrl: (id: string) => `${q(id)}/export`,
  attemptsCsvUrl: (id: string) => `${q(id)}/attempts`,
  templateUrl: '/api/admin/quizzes/template',
};
