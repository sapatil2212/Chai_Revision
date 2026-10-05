// Turns an uploaded document into a suggested quiz + MCQ questions using Gemini.
// Nothing is saved here: the admin reviews and confirms in the UI first.
import { Type, type Schema } from '@google/genai';
import { EXAM_OPTIONS, QUESTION_DIFFICULTY_OPTIONS, QUIZ_DIFFICULTY_OPTIONS, QUIZ_SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { OPTION_IDS, type OptionId } from '@/lib/quizTypes';
import { ValidationError } from '../content';
import { parseQuestionInput, type QuestionInput } from '../quiz/common';
import { documentToParts, generateJson } from './gemini';
import { MCQ_CORE_REQUIRED, bilingual, mcqCoreProperties, notesSchema } from './schemas';

export const MAX_AI_QUESTIONS = 100;

export interface AiQuizDraft {
  title: { mr: string; en: string };
  description: { mr: string; en: string };
  instructions: { mr: string; en: string };
  exam: string;
  subject: string;
  difficulty: string;
  durationMinutes: number;
  passPercentage: number;
  defaultMarks: number;
  defaultNegativeMarks: number;
  badge: string;
}

export interface AiQuestionDraft {
  question: { mr: string; en: string };
  options: { id: OptionId; text: { mr: string; en: string } }[];
  correctOption: OptionId;
  explanation: { mr: string; en: string };
  difficulty: string;
  topic: string;
  marks?: number;
  negativeMarks?: number;
}

export interface ExtractResult {
  quiz: AiQuizDraft | null;
  questions: AiQuestionDraft[];
  warnings: string[];
  meta: { fileName: string; kind: string; found: number; skipped: number; model: string };
}

// -------------------------------------------------------------------------
// Response schemas (force well-formed JSON back from the model)
// -------------------------------------------------------------------------

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: bilingual('Short exam-style test title, max 90 characters'),
    description: bilingual('One-line summary of what this test covers, max 200 characters'),
    instructions: bilingual('3-6 candidate instructions, one per line, separated by \\n. Empty strings if the document has none.'),
    exam: { type: Type.STRING, enum: EXAM_OPTIONS, description: 'Closest matching exam' },
    subject: { type: Type.STRING, enum: QUIZ_SUBJECT_OPTIONS, description: 'Closest matching subject' },
    difficulty: { type: Type.STRING, enum: QUIZ_DIFFICULTY_OPTIONS },
    durationMinutes: { type: Type.INTEGER, description: 'Suggested duration; about 1 minute per question' },
    passPercentage: { type: Type.INTEGER, description: 'Pass mark percentage, usually 40' },
    defaultMarks: { type: Type.NUMBER, description: 'Marks per correct answer stated in the document, else 2' },
    defaultNegativeMarks: { type: Type.NUMBER, description: 'Negative marks per wrong answer stated in the document, else 0.5' },
    badge: { type: Type.STRING, description: 'Optional short label such as "Weekly Mock", else empty string' },
  },
  required: ['title', 'description', 'instructions', 'exam', 'subject', 'difficulty', 'durationMinutes', 'passPercentage', 'defaultMarks', 'defaultNegativeMarks', 'badge'],
};

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ...mcqCoreProperties(bilingual),
    difficulty: { type: Type.STRING, enum: QUESTION_DIFFICULTY_OPTIONS },
    topic: { type: Type.STRING, description: 'Short topic/chapter name, max 60 characters' },
    marks: { type: Type.NUMBER, description: 'Marks for this question if stated, else 0' },
    negativeMarks: { type: Type.NUMBER, description: 'Negative marks if stated, else 0' },
  },
  required: [...MCQ_CORE_REQUIRED, 'difficulty', 'topic'],
};

const resultSchema = (withQuiz: boolean, withQuestions: boolean): Schema => ({
  type: Type.OBJECT,
  properties: {
    ...(withQuiz ? { quiz: quizSchema } : {}),
    ...(withQuestions ? { questions: { type: Type.ARRAY, items: questionSchema } } : {}),
    notes: notesSchema,
  },
  required: [...(withQuiz ? ['quiz'] : []), ...(withQuestions ? ['questions'] : []), 'notes'],
});

// -------------------------------------------------------------------------
// Prompt
// -------------------------------------------------------------------------

const SYSTEM = `You convert study material into a ready-to-publish MCQ mock test for "Chai Revision", a Maharashtra competitive exam platform (MPSC, PSI, STI, ASO, Talathi, Police Bharti, TET, Arogya Bharti).

Rules you must follow:
1. EXTRACT, do not invent. If the document already contains MCQs, reproduce them faithfully (same question, same options, same answer).
2. Only when the document is study notes with no questions, write exam-standard MCQs strictly from facts stated in the document.
3. Every question must have exactly four options with ids A, B, C and D, and exactly one correct answer.
4. Bilingual output: fill both Marathi (Devanagari) and English for every field.
   - If the document is only in one language, translate accurately into the other. Keep technical terms, Article numbers, names, years and numbers identical in both.
   - Never leave both languages empty for a question or an option.
5. If the document states the answer key, use it. If an answer is genuinely unclear, omit that question and add a note instead of guessing.
6. Explanations: use the document's explanation if present; otherwise write one or two factual sentences grounded in the document.
7. Strip question numbers, bullet markers, page headers, footers, watermarks and "Q.1"/"१)" style prefixes.
8. Preserve exact numbers, dates, Article/Section numbers and proper nouns. Do not translate names of people, places or Acts into different words.
9. Keep the document's original order of questions.
10. Return only data that matches the requested JSON schema.`;

const taskLine = (mode: Mode, limit: number) => {
  if (mode === 'metadata') return 'Task: produce ONLY the quiz settings (no questions) that best describe this document.';
  if (mode === 'questions') return `Task: produce ONLY the questions, at most ${limit}.`;
  return `Task: produce the quiz settings AND the questions (at most ${limit}).`;
};

export type Mode = 'metadata' | 'questions' | 'both';

// -------------------------------------------------------------------------
// Normalising + validation of model output
// -------------------------------------------------------------------------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const clampNum = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;

function normaliseQuiz(raw: Record<string, unknown>, questionCount: number): AiQuizDraft {
  const bi = (key: string, max: number) => {
    const o = (raw[key] ?? {}) as Record<string, unknown>;
    return { mr: str(o.mr, max), en: str(o.en, max) };
  };
  const instrRaw = (raw.instructions ?? {}) as Record<string, unknown>;
  const lines = (v: unknown) =>
    typeof v === 'string'
      ? v
          .split('\n')
          .map((l) => l.replace(/^\s*[-•*\d.)\s]+/, '').trim())
          .filter(Boolean)
          .slice(0, 8)
          .join('\n')
          .slice(0, 2000)
      : '';
  return {
    title: bi('title', 200),
    description: bi('description', 400),
    instructions: { mr: lines(instrRaw.mr), en: lines(instrRaw.en) },
    exam: pick(raw.exam, EXAM_OPTIONS, 'MPSC'),
    subject: pick(raw.subject, QUIZ_SUBJECT_OPTIONS, QUIZ_SUBJECT_OPTIONS[0]),
    difficulty: pick(raw.difficulty, QUIZ_DIFFICULTY_OPTIONS, 'Mixed'),
    durationMinutes: clampNum(raw.durationMinutes, 1, 600, Math.max(5, questionCount || 10)),
    passPercentage: clampNum(raw.passPercentage, 0, 100, 40),
    defaultMarks: clampNum(raw.defaultMarks, 0.25, 100, 2),
    defaultNegativeMarks: clampNum(raw.defaultNegativeMarks, 0, 100, 0.5),
    badge: str(raw.badge, 64),
  };
}

/** Validates one AI question through the same rules as manual entry; returns null if unusable. */
function normaliseQuestion(raw: Record<string, unknown>, defaults: { marks: number; negativeMarks: number }):
  | { draft: AiQuestionDraft; input: QuestionInput }
  | null {
  const bi = (v: unknown, max: number) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return { mr: str(o.mr, max), en: str(o.en, max) };
  };
  const rawOptions = Array.isArray(raw.options) ? (raw.options as Record<string, unknown>[]) : [];
  const options = OPTION_IDS.map((id, i) => {
    // Prefer the option that declares this id, else fall back to position
    const found = rawOptions.find((o) => String(o?.id).toUpperCase() === id) ?? rawOptions[i];
    return { id, text: bi(found?.text ?? found, 1000) };
  });

  const draft: AiQuestionDraft = {
    question: bi(raw.question, 4000),
    options,
    correctOption: pick(String(raw.correctOption).toUpperCase(), OPTION_IDS, 'A'),
    explanation: bi(raw.explanation, 6000),
    difficulty: pick(raw.difficulty, QUESTION_DIFFICULTY_OPTIONS, 'Medium'),
    topic: str(raw.topic, 64),
  };
  const marks = clampNum(raw.marks, 0.25, 100, defaults.marks);
  const negativeMarks = clampNum(raw.negativeMarks, 0, 100, defaults.negativeMarks);

  try {
    // Reuse the real validator so AI output can never bypass our rules
    const input = parseQuestionInput({ ...draft, marks, negativeMarks }, defaults);
    return { draft: { ...draft, marks, negativeMarks }, input };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------------

export async function extractQuizFromDocument(opts: {
  file: File;
  mode: Mode;
  limit?: number;
  hint?: string;
  defaults?: { marks: number; negativeMarks: number };
}): Promise<ExtractResult & { inputs: QuestionInput[] }> {
  const limit = Math.min(MAX_AI_QUESTIONS, Math.max(1, opts.limit || 50));
  const wantQuiz = opts.mode !== 'questions';
  const wantQuestions = opts.mode !== 'metadata';

  const { parts, kind } = await documentToParts(opts.file);
  const prompt = [
    taskLine(opts.mode, limit),
    `Source file name: "${opts.file.name}".`,
    opts.hint ? `Admin guidance (follow it): ${opts.hint}` : '',
    'The document follows.',
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await generateJson<{ quiz?: Record<string, unknown>; questions?: Record<string, unknown>[]; notes?: string[] }>({
    systemInstruction: SYSTEM,
    parts: [{ text: prompt }, ...parts],
    schema: resultSchema(wantQuiz, wantQuestions),
  });

  const warnings = (raw.notes || []).map((n) => str(n, 300)).filter(Boolean).slice(0, 10);
  const rawQuestions = wantQuestions && Array.isArray(raw.questions) ? raw.questions.slice(0, limit) : [];

  const quiz = wantQuiz && raw.quiz ? normaliseQuiz(raw.quiz, rawQuestions.length) : null;
  const defaults = opts.defaults ?? { marks: quiz?.defaultMarks ?? 2, negativeMarks: quiz?.defaultNegativeMarks ?? 0.5 };

  const questions: AiQuestionDraft[] = [];
  const inputs: QuestionInput[] = [];
  let skipped = 0;
  for (const rq of rawQuestions) {
    const ok = normaliseQuestion(rq, defaults);
    if (ok) {
      questions.push(ok.draft);
      inputs.push(ok.input);
    } else skipped++;
  }
  if (skipped) warnings.push(`${skipped} extracted question(s) were incomplete and have been dropped.`);
  if (wantQuestions && !questions.length) {
    throw new ValidationError(
      'No usable questions could be read from this document. Make sure it contains MCQs (or clear study notes) and that the text is selectable, not a photo of a page.'
    );
  }

  return {
    quiz,
    questions,
    inputs,
    warnings,
    meta: { fileName: opts.file.name, kind, found: rawQuestions.length, skipped, model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash' },
  };
}
