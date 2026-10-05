// Browser client for the public quiz API + local persistence of the active attempt.
import type { AttemptResult, AttemptSession, LeaderboardEntry, L2, OptionId } from './quizTypes';

export class QuizApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new QuizApiError(data.error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export type MyAttempt = {
  attemptId: number;
  token: string;
  quizSlug: string;
  title: L2;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
};

/** Details every student fills in before a test (email is the only optional field). */
export type StudentDetails = {
  name: string;
  mobile: string;
  email: string;
  address: string;
};

export const quizApi = {
  start: (slug: string, details: StudentDetails) =>
    call<AttemptSession>(`/api/quizzes/${encodeURIComponent(slug)}/start`, {
      method: 'POST',
      body: JSON.stringify(details),
    }),
  get: (attemptId: number, token: string) =>
    call<{ session?: AttemptSession; result?: AttemptResult }>(
      `/api/quizzes/attempts/${attemptId}?token=${encodeURIComponent(token)}`
    ),
  save: (attemptId: number, token: string, answers: Record<string, OptionId | null>) =>
    call<{ saved: number }>(`/api/quizzes/attempts/${attemptId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ token, answers }),
    }),
  submit: (attemptId: number, token: string, answers: Record<string, OptionId | null>) =>
    call<AttemptResult>(`/api/quizzes/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ token, answers }),
      keepalive: true, // lets an auto-submit finish even if the tab is closing
    }),
  leaderboard: (slug: string, limit = 10) =>
    call<{ participants: number; top: LeaderboardEntry[]; you: LeaderboardEntry | null }>(
      `/api/quizzes/${encodeURIComponent(slug)}/leaderboard?limit=${limit}`
    ),
  mine: () => call<{ items: MyAttempt[] }>('/api/quizzes/me'),
};

// ---------------------------------------------------------------------------
// Local persistence (survives refresh; server remains the source of truth)
// ---------------------------------------------------------------------------

const ACTIVE_KEY = 'cr_quiz_active';
const NAME_KEY = 'cr_quiz_name';
const DETAILS_KEY = 'cr_quiz_student';
const answersKey = (id: number) => `cr_quiz_answers_${id}`;

export const EMPTY_STUDENT: StudentDetails = { name: '', mobile: '', email: '', address: '' };

export type ActiveAttempt = { attemptId: number; token: string; slug: string; title: L2 };

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return typeof window === 'undefined' ? fallback : fn();
  } catch {
    return fallback;
  }
};

export const quizStorage = {
  getActive: (): ActiveAttempt | null => safe(() => JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'), null),
  setActive: (a: ActiveAttempt) => safe(() => localStorage.setItem(ACTIVE_KEY, JSON.stringify(a)), undefined),
  clearActive: () =>
    safe(() => {
      const a = quizStorage.getActive();
      if (a) localStorage.removeItem(answersKey(a.attemptId));
      localStorage.removeItem(ACTIVE_KEY);
    }, undefined),
  getAnswers: (id: number): Record<string, OptionId | null> =>
    safe(() => JSON.parse(localStorage.getItem(answersKey(id)) || '{}'), {}),
  setAnswers: (id: number, answers: Record<string, OptionId | null>) =>
    safe(() => localStorage.setItem(answersKey(id), JSON.stringify(answers)), undefined),
  /** Prefills the pre-test form so returning students don't retype everything. */
  getDetails: (): StudentDetails =>
    safe(() => {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || 'null') as Partial<StudentDetails> | null;
      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      return {
        ...EMPTY_STUDENT,
        ...(saved
          ? { name: str(saved.name), mobile: str(saved.mobile), email: str(saved.email), address: str(saved.address) }
          : { name: localStorage.getItem(NAME_KEY) || '' }), // migrate the old name-only key
      };
    }, EMPTY_STUDENT),
  setDetails: (d: StudentDetails) =>
    safe(() => {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(d));
      localStorage.setItem(NAME_KEY, d.name);
    }, undefined),
};
