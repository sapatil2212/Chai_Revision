'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  Star,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { adminApi, AdminApiError, type AdminMaterial, type MaterialBulkAction } from '@/lib/adminApi';
import { EXAM_OPTIONS } from '@/lib/adminOptions';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

type ToastType = 'success' | 'info' | 'error';

interface Props {
  materials: AdminMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<AdminMaterial[]>>;
  loading: boolean;
  globalSearch: string;
  onReload: () => void;
  onEdit: (item: AdminMaterial | null) => void;
  showToast: (text: string, type?: ToastType) => void;
  onUnauthorized: () => void;
}

const selectCls =
  'bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600';

function csvCell(v: unknown) {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

export function MaterialsManager({
  materials,
  setMaterials,
  loading,
  globalSearch,
  onReload,
  onEdit,
  showToast,
  onUnauthorized,
}: Props) {
  const dialog = useAdminDialog();
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState('All');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [price, setPrice] = useState<'all' | 'free' | 'paid'>('all');
  const [fileFilter, setFileFilter] = useState<'all' | 'missing'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fail = (err: unknown, action: string) => {
    if (err instanceof AdminApiError && err.status === 401) return onUnauthorized();
    showToast(`${action} failed: ${(err as Error).message}`, 'error');
  };

  const stats = useMemo(
    () => ({
      total: materials.length,
      published: materials.filter((m) => m.isPublished).length,
      free: materials.filter((m) => m.isFree).length,
      missingPdf: materials.filter((m) => !m.fileUrl).length,
      downloads: materials.reduce((n, m) => n + (m.downloadCount || 0), 0),
    }),
    [materials]
  );

  const filtered = useMemo(() => {
    const q = `${query} ${globalSearch}`.trim().toLowerCase();
    return materials.filter((m) => {
      if (exam !== 'All' && m.exam !== exam) return false;
      if (status === 'published' && !m.isPublished) return false;
      if (status === 'draft' && m.isPublished) return false;
      if (price === 'free' && !m.isFree) return false;
      if (price === 'paid' && m.isFree) return false;
      if (fileFilter === 'missing' && m.fileUrl) return false;
      if (q) {
        const hay = [m.title.en, m.title.mr, m.title.hi, m.subject, m.exam, m.slug, ...(m.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
      }
      return true;
    });
  }, [materials, query, globalSearch, exam, status, price, fileFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((m) => next.delete(m.id));
      else filtered.forEach((m) => next.add(m.id));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const replaceItem = (item: AdminMaterial) => setMaterials((prev) => prev.map((m) => (m.id === item.id ? item : m)));

  // ---------------- row actions ----------------
  const quickToggle = async (m: AdminMaterial, field: 'isPublished' | 'featured') => {
    setBusyId(m.id);
    try {
      const { item } = await adminApi.updateMaterial(m.id, { [field]: !m[field] });
      replaceItem(item);
      showToast(
        field === 'isPublished'
          ? item.isPublished ? 'Published — now visible on the website.' : 'Moved to drafts — hidden from the website.'
          : item.featured ? 'Added to homepage featured list.' : 'Removed from featured list.',
        'success'
      );
    } catch (err) {
      fail(err, 'Update');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (m: AdminMaterial) => {
    setBusyId(m.id);
    try {
      const { item } = await adminApi.duplicateMaterial(m.id);
      setMaterials((prev) => [item, ...prev]);
      showToast(`Copy created as a draft: "${item.title.en}"`, 'success');
    } catch (err) {
      fail(err, 'Duplicate');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (m: AdminMaterial) => {
    const ok = await dialog.confirm({
      title: 'Delete Study Material?',
      message: `Are you sure you want to permanently delete "${m.title.en || m.title.mr}"?`,
      note: 'Its cover image, sample previews, and master PDF file will be removed from secure storage.',
      confirmText: 'Delete Material',
      variant: 'danger',
    });
    if (!ok) return;

    setBusyId(m.id);
    try {
      const res = await adminApi.deleteMaterial(m.id);
      if (res.archived) {
        replaceItem({ ...m, isPublished: false });
        showToast('This material has purchases, so it was unpublished instead of deleted.', 'info');
      } else {
        setMaterials((prev) => prev.filter((x) => x.id !== m.id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
        showToast('Material deleted.', 'info');
      }
    } catch (err) {
      fail(err, 'Delete');
    } finally {
      setBusyId(null);
    }
  };

  // ---------------- bulk ----------------
  const runBulk = async (action: MaterialBulkAction) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === 'delete') {
      const ok = await dialog.confirm({
        title: `Delete ${ids.length} Study Material${ids.length > 1 ? 's' : ''}?`,
        message: `Are you sure you want to delete ${ids.length} material(s) and their uploaded files?`,
        note: 'Materials with active student purchases will be safely unpublished instead of purged.',
        confirmText: `Delete ${ids.length} Item${ids.length > 1 ? 's' : ''}`,
        variant: 'danger',
      });
      if (!ok) return;
    }
    setBulkBusy(true);
    try {
      const res = await adminApi.bulkMaterials(ids, action);
      setSelected(new Set());
      onReload();
      const note = res.archived.length ? ` (${res.archived.length} with purchases were unpublished instead)` : '';
      showToast(`${res.affected} material(s) updated${note}.`, 'success');
    } catch (err) {
      fail(err, 'Bulk action');
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = () => {
    const header = ['ID', 'Slug', 'Title (EN)', 'Title (MR)', 'Exam', 'Subject', 'Type', 'Medium', 'Pages', 'Price', 'MRP', 'Free', 'Published', 'Featured', 'PDF', 'Downloads', 'Updated'];
    const rows = filtered.map((m) =>
      [m.id, m.slug, m.title.en, m.title.mr, m.exam, m.subject, m.materialType, m.language, m.pages, m.discountedPrice, m.originalPrice, m.isFree, m.isPublished, m.featured, m.fileName || (m.fileUrl ? 'yes' : ''), m.downloadCount, m.lastUpdated]
        .map(csvCell)
        .join(',')
    );
    // BOM so Excel opens Devanagari correctly
    const blob = new Blob(['\uFEFF' + [header.map(csvCell).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_materials_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} material(s).`, 'success');
  };

  const statCard = (label: string, value: number | string, tone = 'text-slate-900') => (
    <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-lg font-extrabold font-mono ${tone}`}>{value}</p>
    </div>
  );

  return (
    <main className="p-4 sm:p-8 space-y-5 flex-1">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E2653]">Study Materials</h1>
          <p className="text-xs text-slate-500 mt-1">
            Everything here is live: changes appear on the website as soon as you save.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onReload} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50" aria-label="Reload materials">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button onClick={() => onEdit(null)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCard('Total', stats.total)}
        {statCard('Published', stats.published, 'text-emerald-700')}
        {statCard('Drafts', stats.total - stats.published, 'text-slate-500')}
        {statCard('Missing PDF', stats.missingPdf, stats.missingPdf ? 'text-amber-600' : 'text-slate-900')}
        {statCard('Free downloads', stats.downloads, 'text-blue-700')}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, subject, slug, tags…"
            aria-label="Search materials"
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:border-blue-600"
          />
        </div>
        <select aria-label="Filter by exam" value={exam} onChange={(e) => setExam(e.target.value)} className={selectCls}>
          <option value="All">All exams</option>
          {EXAM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select aria-label="Filter by price" value={price} onChange={(e) => setPrice(e.target.value as typeof price)} className={selectCls}>
          <option value="all">Free & paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </select>
        <select aria-label="Filter by PDF" value={fileFilter} onChange={(e) => setFileFilter(e.target.value as typeof fileFilter)} className={selectCls}>
          <option value="all">Any PDF status</option>
          <option value="missing">PDF missing</option>
        </select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 bg-[#1C2C5B] text-white rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs shadow-md" role="region" aria-label="Bulk actions">
          <span className="font-bold mr-2">{selected.size} selected</span>
          {([
            ['publish', 'Publish'],
            ['unpublish', 'Unpublish'],
            ['feature', 'Feature'],
            ['unfeature', 'Unfeature'],
          ] as const).map(([a, label]) => (
            <button key={a} disabled={bulkBusy} onClick={() => runBulk(a)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-semibold cursor-pointer disabled:opacity-50">
              {label}
            </button>
          ))}
          <button disabled={bulkBusy} onClick={() => runBulk('delete')} className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 font-semibold cursor-pointer disabled:opacity-50">
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto px-2 py-1.5 text-white/80 hover:text-white cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 pl-4 w-8">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible materials" className="w-4 h-4 rounded-sm" />
                </th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3">Exam / Type</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">PDF</th>
                <th className="py-3 px-3 text-center">Published</th>
                <th className="py-3 px-3 text-center">Featured</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && !materials.length && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" aria-hidden="true" />
                    Loading from database…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                    <p className="font-semibold text-slate-700">{materials.length ? 'No materials match these filters' : 'No study materials yet'}</p>
                    {!materials.length && (
                      <button onClick={() => onEdit(null)} className="mt-3 px-4 py-2 bg-[#1C2C5B] text-white rounded-xl font-semibold cursor-pointer">
                        Add your first material
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((m) => {
                const busy = busyId === m.id;
                return (
                  <tr key={m.id} className={`hover:bg-slate-50/80 transition-colors ${busy ? 'opacity-60' : ''} ${selected.has(m.id) ? 'bg-blue-50/40' : ''}`}>
                    <td className="py-3 pl-4">
                      <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleOne(m.id)} aria-label={`Select ${m.title.en}`} className="w-4 h-4 rounded-sm" />
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img src={m.coverImage} alt="" className="w-10 h-12 rounded-md object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{m.title.en || m.title.mr}</p>
                          {m.title.mr && m.title.mr !== m.title.en && <p className="text-[11px] text-slate-500 truncate">{m.title.mr}</p>}
                          <p className="text-[10px] text-slate-400 font-mono truncate">/{m.slug} • {m.pages} pgs • order {m.sortOrder}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-medium">{m.exam}</span>
                      <p className="text-[11px] text-slate-500 mt-1">{m.materialType}</p>
                      <p className="text-[10px] text-slate-400">{m.subject}</p>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {m.isFree ? (
                        <span className="font-bold text-emerald-700">FREE</span>
                      ) : (
                        <>
                          <span className="font-bold text-slate-900">₹{m.discountedPrice}</span>
                          {m.originalPrice > m.discountedPrice && <span className="block text-[10px] text-slate-400 line-through">₹{m.originalPrice}</span>}
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {m.fileUrl ? (
                        <a href={adminApi.materialFileUrl(m.id, true)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline" title={m.fileName || ''}>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          {m.fileSize || 'PDF'}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Missing
                        </span>
                      )}
                      {m.isFree && <p className="text-[10px] text-slate-400 mt-0.5">{m.downloadCount} downloads</p>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        role="switch"
                        aria-checked={m.isPublished}
                        aria-label={`Published: ${m.title.en}`}
                        disabled={busy}
                        onClick={() => quickToggle(m, 'isPublished')}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${m.isPublished ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${m.isPublished ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        aria-pressed={m.featured}
                        aria-label={`Featured: ${m.title.en}`}
                        disabled={busy}
                        onClick={() => quickToggle(m, 'featured')}
                        className="p-1 rounded-lg hover:bg-amber-50 cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${m.featured ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button onClick={() => onEdit(m)} disabled={busy} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg cursor-pointer" title="Edit" aria-label={`Edit ${m.title.en}`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => duplicate(m)} disabled={busy} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg cursor-pointer" title="Duplicate" aria-label={`Duplicate ${m.title.en}`}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/#materials/${m.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block p-1.5 rounded-lg ${m.isPublished ? 'text-slate-400 hover:text-blue-700 hover:bg-slate-100' : 'text-slate-200 pointer-events-none'}`}
                        title={m.isPublished ? 'View on website' : 'Publish to view on website'}
                        aria-label={`View ${m.title.en} on website`}
                        aria-disabled={!m.isPublished}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => remove(m)} disabled={busy} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Delete" aria-label={`Delete ${m.title.en}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <FileText className="w-3 h-3" aria-hidden="true" />
          Showing {filtered.length} of {materials.length}
        </div>
      </div>
    </main>
  );
}
