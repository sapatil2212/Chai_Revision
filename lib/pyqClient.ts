// Browser client for the public PYQ API.
import type { PyqFilterOptions, PyqPage, PyqQuestion } from './pyqTypes';

export class PyqApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PyqApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export type PyqBrowseQuery = {
  exam?: string;
  year?: string | number;
  subject?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

function qs(q: PyqBrowseQuery): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '' || v === 'All') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const pyqApi = {
  list: (q: PyqBrowseQuery = {}) => call<PyqPage<PyqQuestion>>(`/api/pyqs${qs(q)}`),
  filters: () => call<PyqFilterOptions>('/api/pyqs/filters'),
};
