// Client helpers for the admin PYQ APIs (auth via the HttpOnly admin session cookie).
import { request } from './adminApi';
import type { AdminPyq, L3, OptionId, PyqFilterOptions } from './pyqTypes';

export type PyqStats = {
  total: number;
  published: number;
  drafts: number;
  years: number;
  exams: number;
  subjects: number;
  byYear: { year: number; count: number }[];
};

export type PyqListPage = {
  items: AdminPyq[];
  total: number;
  limit: number;
  offset: number;
  filters: PyqFilterOptions;
  stats: PyqStats;
};

export type PyqListQuery = {
  exam?: string;
  year?: number | string;
  subject?: string;
  topic?: string;
  source?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type PyqCsvResult = { inserted: number; errors: { row: number; message: string }[] };

export type AiPaperDraft = { exam: string; year: number; subject: string; source: string };

export type AiPyqDraft = {
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
};

export type PyqAiResult = {
  paper: AiPaperDraft | null;
  questions: AiPyqDraft[];
  warnings: string[];
  meta: { fileName: string; kind: string; found: number; skipped: number; model: string };
};

export function pyqQueryString(q: PyqListQuery = {}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '' || v === 'All') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const one = (id: string) => `/api/admin/pyqs/${encodeURIComponent(id)}`;
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const pyqAdminApi = {
  list: (q: PyqListQuery = {}) => request<PyqListPage>(`/api/admin/pyqs${pyqQueryString(q)}`),
  create: (body: Record<string, unknown>) => request<{ item: AdminPyq }>('/api/admin/pyqs', json('POST', body)),
  get: (id: string) => request<{ item: AdminPyq }>(one(id)),
  update: (id: string, body: Record<string, unknown>) => request<{ item: AdminPyq }>(one(id), json('PATCH', body)),
  remove: (id: string) => request<{ ok: true }>(one(id), json('DELETE')),
  duplicate: (id: string) => request<{ item: AdminPyq }>(`${one(id)}/duplicate`, json('POST')),

  /** Publish / unpublish / delete many at once. */
  action: (ids: string[], action: 'publish' | 'unpublish' | 'delete') =>
    request<{ ok: true; action: string; affected: number }>('/api/admin/pyqs/actions', json('POST', { ids, action })),

  /** Saves already-reviewed questions (AI flow). */
  addBulk: (questions: Record<string, unknown>[]) =>
    request<{ ok: true; inserted: number }>('/api/admin/pyqs/bulk', json('POST', { questions })),

  /** Resolves with row errors (does not throw) so the UI can list them. */
  importCsv: async (csv: string): Promise<PyqCsvResult> => {
    const res = await fetch('/api/admin/pyqs/import', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok || Array.isArray(data.errors)) return { inserted: data.inserted ?? 0, errors: data.errors ?? [] };
    const err = new Error(data.error || `Import failed (${res.status})`) as Error & { status: number };
    err.status = res.status;
    throw err;
  },

  /** Reads a previous-year paper with Gemini. Nothing is saved until the admin confirms. */
  aiExtract: (
    file: File,
    opts: { limit?: number; hint?: string; exam?: string; year?: number | string; subject?: string; source?: string } = {}
  ) => {
    const form = new FormData();
    form.append('file', file);
    for (const [k, v] of Object.entries(opts)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') form.append(k, String(v));
    }
    return request<PyqAiResult>('/api/admin/pyqs/ai-extract', { method: 'POST', body: form });
  },

  // Plain links (GET with the admin cookie) for file downloads
  exportUrl: (q: PyqListQuery = {}) => {
    const qs = pyqQueryString({ ...q, limit: undefined, offset: undefined });
    return `/api/admin/pyqs${qs ? `${qs}&` : '?'}format=csv`;
  },
  templateUrl: '/api/admin/pyqs/template',
};
