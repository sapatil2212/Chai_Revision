// Client-safe quiz types shared by the public quiz UI, admin UI and server.
export type OptionId = 'A' | 'B' | 'C' | 'D';
export const OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D'];
export type L2 = { mr: string; en: string; hi?: string };
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizStatus = 'live' | 'upcoming' | 'ended';

/** Public quiz card data (never includes questions or answers). */
export interface QuizSummary {
  id: string;
  slug: string;
  title: L2;
  description: L2;
  instructions: L2 | null;
  exam: string;
  subject: string;
  difficulty: QuizDifficulty;
  durationMinutes: number;
  questionCount: number;
  totalMarks: number;
  passPercentage: number;
  negativeMarking: boolean;
  negativeLabel: string | null;
  badge: string | null;
  featured: boolean;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
  attemptsCount: number;
  maxAttempts: number; // 0 = unlimited
  showSolutions: boolean;
}

/** A question as served during a test — no correct answer, no explanation. */
export interface PlayQuestion {
  id: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question: L2;
  options: { id: OptionId; text: L2 }[]; // already shuffled if the quiz shuffles options
  marks: number;
  negativeMarks: number;
  image: string | null;
}

export interface AttemptSession {
  attemptId: number;
  token: string;
  participantName: string;
  quiz: QuizSummary;
  questions: PlayQuestion[];
  answers: Record<string, OptionId | null>;
  startedAt: string;
  expiresAt: string; // startedAt + duration
  serverNow: string; // for clock-skew correction
  resumed: boolean;
}

export interface QuestionReview {
  id: string;
  topic: string;
  question: L2;
  options: { id: OptionId; text: L2 }[]; // original A–D order
  image: string | null;
  marks: number;
  negativeMarks: number;
  selected: OptionId | null;
  status: 'correct' | 'wrong' | 'skipped';
  marksAwarded: number;
  correctOption: OptionId | null; // null when the quiz hides solutions
  explanation: L2 | null;
}

export interface AttemptResult {
  attemptId: number;
  quizSlug: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  passed: boolean;
  passPercentage: number;
  timeTakenSeconds: number;
  isLate: boolean;
  rank: number | null; // null for late attempts
  participants: number;
  showSolutions: boolean;
  review: QuestionReview[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string;
  isYou: boolean;
}

export function quizStatus(q: Pick<QuizSummary, 'startsAt' | 'endsAt'>, now = Date.now()): QuizStatus {
  if (q.startsAt && new Date(q.startsAt).getTime() > now) return 'upcoming';
  if (q.endsAt && new Date(q.endsAt).getTime() <= now) return 'ended';
  return 'live';
}

export const formatClock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(r).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
