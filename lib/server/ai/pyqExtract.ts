// Reads an actual previous-year question paper (plus its answer key, if present)
// and returns tagged PYQ drafts. Nothing is saved: the admin reviews first.
import { Type, type Schema } from '@google/genai';
import { EXAM_OPTIONS, QUESTION_DIFFICULTY_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { OPTION_IDS, PYQ_YEAR_MIN, pyqYearMax, type L3, type OptionId } from '@/lib/pyqTypes';
import { ValidationError } from '../content';
import { parsePyqInput, type PyqInput } from '../pyq/common';
import { documentToParts, generateJson } from './gemini';
import { MCQ_CORE_REQUIRED, mcqCoreProperties, notesSchema, trilingual } from './schemas';

export const MAX_AI_PYQS = 200;

/** What the paper is: used to pre-fill the admin form and tag every question. */
export interface AiPaperDraft {
  exam: string;
  year: number;
  subject: string;
  /** Human-readable paper name, e.g. "MPSC Rajyaseva Prelims 2024 Paper 1". */
  source: string;
}

export interface AiPyqDraft {
  exam: string;
  year: number;
  subject: string;
  topic: string;
  source: string;
  questionNumber: number | null;
  question: L3;
  options: { id: OptionId; text: L3 }[];
  correctOption: OptionId;
  explanation: L3;
  difficulty: string;
}

export interface PyqExtractResult {
  paper: AiPaperDraft | null;
  questions: AiPyqDraft[];
  warnings: string[];
  meta: { fileName: string; kind: string; found: number; skipped: number; model: string };
}

// -------------------------------------------------------------------------
// Response schema
// -------------------------------------------------------------------------

const paperSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    exam: { type: Type.STRING, enum: EXAM_OPTIONS, description: 'Closest matching exam named on the paper' },
    year: { type: Type.INTEGER, description: 'Year the paper was held, as printed on the paper' },
    subject: { type: Type.STRING, enum: SUBJECT_OPTIONS, description: 'Dominant subject of the paper' },
    source: {
      type: Type.STRING,
      description: 'Paper name exactly as printed, e.g. "MPSC Rajyaseva Prelims 2024 Paper 1". Max 150 characters.',
    },
  },
  required: ['exam', 'year', 'subject', 'source'],
};

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ...mcqCoreProperties(trilingual),
    subject: { type: Type.STRING, enum: SUBJECT_OPTIONS, description: 'Subject of this particular question' },
    topic: { type: Type.STRING, description: 'Short topic/chapter name, max 60 characters' },
    questionNumber: { type: Type.INTEGER, description: 'Question number printed on the paper, else 0' },
    difficulty: { type: Type.STRING, enum: QUESTION_DIFFICULTY_OPTIONS },
  },
  required: [...MCQ_CORE_REQUIRED, 'subject', 'topic', 'difficulty'],
};

const resultSchema = (withPaper: boolean): Schema => ({
  type: Type.OBJECT,
  properties: {
    ...(withPaper ? { paper: paperSchema } : {}),
    questions: { type: Type.ARRAY, items: questionSchema },
    notes: notesSchema,
  },
  required: [...(withPaper ? ['paper'] : []), 'questions', 'notes'],
});

// -------------------------------------------------------------------------
// Prompt
// -------------------------------------------------------------------------

const SYSTEM = `You digitise previous-year question papers for "Chai Revision", a Maharashtra competitive exam platform (MPSC, PSI, STI, ASO, Talathi, Police Bharti, TET, Arogya Bharti, Forest Service).

The document is a real past exam paper, a question bank, or a solved paper. Your job is to transcribe it faithfully so students can practise the genuine questions.

Rules you must follow:
1. TRANSCRIBE, do not invent. Reproduce each question, its options and its stated answer exactly as printed. Never create new questions.
2. Identify the exam and the YEAR from the paper header, title block, watermark or footer. The year is important — take it from the document, do not guess from the file name unless the paper itself does not state it.
3. Every question must have exactly four options with ids A, B, C and D, and exactly one correct answer.
4. Answers: use the answer key if the document has one (it is often a grid at the end). If a question's answer is not stated anywhere and cannot be determined with certainty from the document, SKIP that question and add a note. Never guess an answer.
5. Languages: fill Marathi (Devanagari) and English for every field. Many Maharashtra papers are already bilingual — use the printed text for both. If only one language is printed, translate accurately into the other. Fill Hindi too when you are confident, otherwise leave hi as an empty string.
   - Keep names, places, Acts, Article/Section numbers, years and all numerals identical across languages.
6. Keep the question number printed on the paper in questionNumber, and keep the paper's original order.
7. Strip "Q.1", "१)", option prefixes, page headers, footers, watermarks, instructions blocks and marks notations from the text.
8. Tag each question with its own subject and a short topic/chapter name, even when the paper is a mixed general-studies paper.
9. Explanations: use the paper's own explanation or solution if present. If there is none, write one or two factual sentences that justify the keyed answer. Do not contradict the answer key.
10. Return only data that matches the requested JSON schema.`;

// -------------------------------------------------------------------------
// Normalising + validation of model output
// -------------------------------------------------------------------------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;

const tri = (v: unknown, max: number): L3 => {
  const o = (v ?? {}) as Record<string, unknown>;
  return { mr: str(o.mr, max), en: str(o.en, max), hi: str(o.hi, max) };
};

function normalisePaper(raw: Record<string, unknown>, fallbackYear: number): AiPaperDraft {
  const year = Number(raw.year);
  return {
    exam: pick(raw.exam, EXAM_OPTIONS, 'MPSC'),
    year: Number.isInteger(year) && year >= PYQ_YEAR_MIN && year <= pyqYearMax() ? year : fallbackYear,
    subject: pick(raw.subject, SUBJECT_OPTIONS, SUBJECT_OPTIONS[0]),
    source: str(raw.source, 150),
  };
}

/** Admin overrides win over whatever the model decided. */
export interface PyqOverrides {
  exam?: string;
  year?: number;
  subject?: string;
  source?: string;
}

/** Validates one AI question through the real PYQ validator; returns null if unusable. */
function normaliseQuestion(
  raw: Record<string, unknown>,
  paper: AiPaperDraft,
  overrides: PyqOverrides
): { draft: AiPyqDraft; input: PyqInput } | null {
  const rawOptions = Array.isArray(raw.options) ? (raw.options as Record<string, unknown>[]) : [];
  const options = OPTION_IDS.map((id, i) => {
    // Prefer the option that declares this id, else fall back to position
    const found = rawOptions.find((o) => String(o?.id).toUpperCase() === id) ?? rawOptions[i];
    return { id, text: tri(found?.text ?? found, 1000) };
  });

  const qNum = Number(raw.questionNumber);
  const draft: AiPyqDraft = {
    exam: overrides.exam || paper.exam,
    year: overrides.year ?? paper.year,
    subject: overrides.subject || pick(raw.subject, SUBJECT_OPTIONS, paper.subject),
    topic: str(raw.topic, 64),
    source: overrides.source || paper.source,
    questionNumber: Number.isInteger(qNum) && qNum > 0 && qNum <= 1000 ? qNum : null,
    question: tri(raw.question, 4000),
    options,
    correctOption: pick(String(raw.correctOption).toUpperCase(), OPTION_IDS, 'A'),
    explanation: tri(raw.explanation, 6000),
    difficulty: pick(raw.difficulty, QUESTION_DIFFICULTY_OPTIONS, 'Medium'),
  };

  try {
    // Reuse the real validator so AI output can never bypass our rules
    return { draft, input: parsePyqInput({ ...draft }) };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------------
// Entry point
// -------------------------------------------------------------------------

export async function extractPyqsFromDocument(opts: {
  file: File;
  limit?: number;
  hint?: string;
  /** Admin-chosen values that override the model's detection. */
  overrides?: PyqOverrides;
}): Promise<PyqExtractResult & { inputs: PyqInput[] }> {
  const limit = Math.min(MAX_AI_PYQS, Math.max(1, opts.limit || 60));
  const overrides = opts.overrides ?? {};
  // Only ask the model to identify the paper if the admin has not already pinned it down
  const withPaper = !(overrides.exam && overrides.year && overrides.source);

  const { parts, kind } = await documentToParts(opts.file);
  const prompt = [
    `Task: transcribe the previous-year questions from this document, at most ${limit}.`,
    withPaper ? 'Also identify the paper: exam, year and the printed paper name.' : '',
    overrides.exam ? `The admin says the exam is "${overrides.exam}" — use it.` : '',
    overrides.year ? `The admin says the year is ${overrides.year} — use it.` : '',
    `Source file name: "${opts.file.name}".`,
    opts.hint ? `Admin guidance (follow it): ${opts.hint}` : '',
    'The document follows.',
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await generateJson<{
    paper?: Record<string, unknown>;
    questions?: Record<string, unknown>[];
    notes?: string[];
  }>({
    systemInstruction: SYSTEM,
    parts: [{ text: prompt }, ...parts],
    schema: resultSchema(withPaper),
  });

  const warnings = (raw.notes || []).map((n) => str(n, 300)).filter(Boolean).slice(0, 10);
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions.slice(0, limit) : [];

  const fallbackYear = overrides.year ?? new Date().getFullYear();
  const detected = raw.paper ? normalisePaper(raw.paper, fallbackYear) : null;
  const paper: AiPaperDraft = {
    exam: overrides.exam || detected?.exam || 'MPSC',
    year: overrides.year ?? detected?.year ?? fallbackYear,
    subject: overrides.subject || detected?.subject || SUBJECT_OPTIONS[0],
    source: overrides.source || detected?.source || opts.file.name.replace(/\.[^.]+$/, '').slice(0, 150),
  };

  const questions: AiPyqDraft[] = [];
  const inputs: PyqInput[] = [];
  let skipped = 0;
  for (const rq of rawQuestions) {
    const ok = normaliseQuestion(rq, paper, overrides);
    if (ok) {
      questions.push(ok.draft);
      inputs.push(ok.input);
    } else skipped++;
  }
  if (skipped) warnings.push(`${skipped} extracted question(s) were incomplete and have been dropped.`);
  if (!questions.length) {
    throw new ValidationError(
      'No usable questions could be read from this paper. Make sure it contains MCQs with an answer key, and that the text is selectable rather than a photo of a page.'
    );
  }

  return {
    paper,
    questions,
    inputs,
    warnings,
    meta: {
      fileName: opts.file.name,
      kind,
      found: rawQuestions.length,
      skipped,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
    },
  };
}
