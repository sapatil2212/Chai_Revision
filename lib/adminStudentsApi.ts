// Client helpers for the superadmin students directory (details collected before each quiz).
import { request } from './adminApi';

export type StudentSort = 'recent' | 'name' | 'attempts' | 'best';

export type QuizStudent = {
  key: string;
  name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  attempts: number;
  submitted: number;
  inProgress: number;
  tests: number;
  passed: number;
  bestPercentage: number;
  avgPercentage: number;
  lastQuizTitle: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type StudentAttempt = {
  id: number;
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  status: 'in_progress' | 'submitted';
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  passed: boolean;
  isLate: boolean;
  timeTakenSeconds: number;
  startedAt: string;
  completedAt: string | null;
  name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
};

export type StudentsSummary = {
  students: number;
  attempts: number;
  submitted: number;
  inProgress: number;
  avgPercentage: number;
  newLast7Days: number;
  activeLast7Days: number;
  withEmail: number;
  truncated: boolean;
};

export type StudentsPage = {
  items: QuizStudent[];
  total: number;
  limit: number;
  offset: number;
  summary: StudentsSummary;
};

export const studentsAdminApi = {
  list: (opts: { search?: string; sort?: StudentSort; limit?: number; offset?: number } = {}) => {
    const sp = new URLSearchParams();
    if (opts.search) sp.set('search', opts.search);
    if (opts.sort) sp.set('sort', opts.sort);
    if (opts.limit) sp.set('limit', String(opts.limit));
    if (opts.offset) sp.set('offset', String(opts.offset));
    const q = sp.toString();
    return request<StudentsPage>(`/api/admin/quiz-students${q ? `?${q}` : ''}`);
  },
  get: (key: string) =>
    request<{ student: QuizStudent; attempts: StudentAttempt[] }>(`/api/admin/quiz-students/${encodeURIComponent(key)}`),
  csvUrl: (search?: string) =>
    `/api/admin/quiz-students?format=csv${search ? `&search=${encodeURIComponent(search)}` : ''}`,
};
