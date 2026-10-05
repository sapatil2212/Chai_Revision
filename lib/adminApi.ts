// Client-side helpers for the superadmin API. Auth is carried by the HttpOnly session cookie.
import type { ExamUpdate, Product } from './types';

export type AdminMaterial = Product & {
  fileUrl: string | null;
  fileName: string | null;
  isPublished: boolean;
  sortOrder: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UploadResult = {
  kind: 'image' | 'pdf';
  ref: string; // "temp/<name>" — send back when saving
  previewUrl: string;
  size: number;
  fileSize: string;
  originalName: string;
  pageCount: number | null; // PDFs only
};

export type MaterialBulkAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete';
export type AdminUpdate = ExamUpdate & { isPublished: boolean; createdAt: string };

export class AdminApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: init?.body instanceof FormData ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(data.error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export const adminApi = {
  session: () => request<{ authenticated: boolean; email: string }>('/api/admin/session'),
  login: (email: string, password: string, remember: boolean) =>
    request<{ ok: true; email: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    }),
  logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),

  listMaterials: () => request<{ items: AdminMaterial[] }>('/api/admin/materials'),
  createMaterial: (body: Record<string, unknown>) =>
    request<{ item: AdminMaterial }>('/api/admin/materials', { method: 'POST', body: JSON.stringify(body) }),
  updateMaterial: (id: string, body: Record<string, unknown>) =>
    request<{ item: AdminMaterial }>(`/api/admin/materials/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteMaterial: (id: string) =>
    request<{ ok: true; archived: boolean }>(`/api/admin/materials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  duplicateMaterial: (id: string) =>
    request<{ item: AdminMaterial }>(`/api/admin/materials/${encodeURIComponent(id)}/duplicate`, { method: 'POST' }),
  bulkMaterials: (ids: string[], action: MaterialBulkAction) =>
    request<{ ok: true; affected: number; archived: string[] }>('/api/admin/materials/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    }),
  materialFileUrl: (id: string, inline = false) =>
    `/api/admin/materials/${encodeURIComponent(id)}/file${inline ? '?inline=1' : ''}`,
  storageStatus: () =>
    request<{ root: string; healthy: boolean; folders: Record<string, string> }>('/api/admin/storage'),

  listUpdates: () => request<{ items: AdminUpdate[] }>('/api/admin/updates'),
  createUpdate: (body: Record<string, unknown>) =>
    request<{ item: AdminUpdate }>('/api/admin/updates', { method: 'POST', body: JSON.stringify(body) }),
  updateUpdate: (id: string, body: Record<string, unknown>) =>
    request<{ item: AdminUpdate }>(`/api/admin/updates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteUpdate: (id: string) =>
    request<{ ok: true }>(`/api/admin/updates/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  upload: (file: File, kind: 'image' | 'pdf') => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return request<UploadResult>('/api/admin/upload', {
      method: 'POST',
      body: form,
    });
  },
};
