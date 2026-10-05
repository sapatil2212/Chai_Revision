// Response-schema building blocks shared by the quiz and PYQ extractors.
// Keeping them in one place means both features ask Gemini for the same MCQ shape.
import { Type, type Schema } from '@google/genai';
import { OPTION_IDS } from '@/lib/quizTypes';

/** { mr, en } text node. */
export const bilingual = (description: string): Schema => ({
  type: Type.OBJECT,
  description,
  properties: {
    mr: { type: Type.STRING, description: 'Marathi text (Devanagari). Empty string if not available.' },
    en: { type: Type.STRING, description: 'English text. Empty string if not available.' },
  },
  required: ['mr', 'en'],
});

/** { mr, en, hi } text node. Hindi may be empty; it is filled from Marathi afterwards. */
export const trilingual = (description: string): Schema => ({
  type: Type.OBJECT,
  description,
  properties: {
    mr: { type: Type.STRING, description: 'Marathi text (Devanagari). Empty string if not available.' },
    en: { type: Type.STRING, description: 'English text. Empty string if not available.' },
    hi: { type: Type.STRING, description: 'Hindi text (Devanagari). Empty string if you are not confident.' },
  },
  required: ['mr', 'en'],
});

export type TextSchema = (description: string) => Schema;

/** Exactly four options, ids A-D, in order. */
export const optionsSchema = (text: TextSchema): Schema => ({
  type: Type.ARRAY,
  description: 'Exactly four options in order A, B, C, D',
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, enum: [...OPTION_IDS] },
      text: text('Option text without the A/B/C/D prefix'),
    },
    required: ['id', 'text'],
  },
});

/** The fields every extracted MCQ shares. */
export const mcqCoreProperties = (text: TextSchema) => ({
  question: text('The question text, without the question number'),
  options: optionsSchema(text),
  correctOption: { type: Type.STRING, enum: [...OPTION_IDS], description: 'The correct option id' },
  explanation: text('Why the answer is correct. Empty strings if the document gives no explanation.'),
});

export const MCQ_CORE_REQUIRED = ['question', 'options', 'correctOption', 'explanation'];

/** Short list of admin-facing warnings the model can return alongside the data. */
export const notesSchema: Schema = {
  type: Type.ARRAY,
  description: 'Short warnings for the admin, e.g. unreadable pages or questions with no stated answer',
  items: { type: Type.STRING },
};
