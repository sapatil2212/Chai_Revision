// Option lists for admin forms (client-safe; must match server validation in lib/server/content.ts)
export const EXAM_OPTIONS = [
  'MPSC', 'PSI', 'STI', 'ASO', 'Talathi', 'Police Bharti', 'Arogya Bharti', 'TET / TAIT', 'सरळसेवा', 'Forest Service',
];

export const SUBJECT_OPTIONS = [
  'Polity & Constitution',
  'Maharashtra & Indian History',
  'Maharashtra & World Geography',
  'Indian Economy',
  'General Science',
  'CSAT & Reasoning',
  'Marathi Grammar',
  'English Grammar',
  'Current Affairs',
  'Environment & Ecology',
];

export const LANGUAGE_OPTIONS = ['Marathi', 'English', 'Bilingual', 'Hindi'];

export const MATERIAL_TYPE_OPTIONS = [
  'PDF Notes', 'Short Notes', 'Revision Notes', 'Yearbooks', 'PYQ Books',
  'Practice Papers', 'Question Banks', 'Current Affairs', 'Study Guides',
];

export const UPDATE_CATEGORY_OPTIONS = [
  'Exam Forms', 'Exam Notifications', 'Admit Card', 'Results', 'Answer Keys', 'Recruitment', 'Important Dates',
];

export const UPDATE_BADGE_OPTIONS = ['NEW', 'IMPORTANT', 'LAST DATE', 'ADMIT CARD', 'RESULT'];

/** Display labels (Marathi) for subjects on the public site. Keys are the stored values. */
export const SUBJECT_LABELS_MR: Record<string, string> = {
  'Polity & Constitution': 'राज्यघटना',
  'Maharashtra & Indian History': 'इतिहास',
  'Maharashtra & World Geography': 'भूगोल',
  'Indian Economy': 'अर्थव्यवस्था',
  'General Science': 'सामान्य विज्ञान',
  'CSAT & Reasoning': 'CSAT व बुद्धिमत्ता',
  'Marathi Grammar': 'मराठी व्याकरण',
  'English Grammar': 'इंग्रजी व्याकरण',
  'Current Affairs': 'चालू घडामोडी',
  'Environment & Ecology': 'पर्यावरण',
};

/** Resolve a stored file reference to a URL the admin browser can display. */
export function adminPreviewUrl(ref: string): string {
  return ref.startsWith('temp/') ? `/api/admin/media/temp/${ref.slice(5)}` : ref;
}

/** Quizzes can also be full mixed-subject mock tests. */
export const QUIZ_SUBJECT_OPTIONS = [...SUBJECT_OPTIONS, 'Mixed (Full Mock)'];
export const QUIZ_DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Mixed'];
export const QUESTION_DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

/** Columns for the question CSV import/export (also used for the downloadable template). */
export const QUESTION_CSV_COLUMNS = [
  'question_mr', 'question_en',
  'option_a_mr', 'option_a_en', 'option_b_mr', 'option_b_en',
  'option_c_mr', 'option_c_en', 'option_d_mr', 'option_d_en',
  'correct_option', 'explanation_mr', 'explanation_en',
  'marks', 'negative_marks', 'difficulty', 'topic',
] as const;
