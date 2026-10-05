'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Upload,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { adminApi, AdminApiError, type AdminMaterial } from '@/lib/adminApi';
import {
  EXAM_OPTIONS,
  LANGUAGE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  SUBJECT_OPTIONS,
  adminPreviewUrl,
} from '@/lib/adminOptions';

interface Props {
  initial: AdminMaterial | null; // null = create
  onClose: () => void;
  onSaved: (item: AdminMaterial, mode: 'created' | 'updated') => void;
  onUnauthorized: () => void;
}

type LangKey = 'en' | 'mr' | 'hi';
const LANGS: { key: LangKey; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'mr', label: 'मराठी' },
  { key: 'hi', label: 'हिन्दी' },
];

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white disabled:opacity-50';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const legendCls = 'col-span-full text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1';

type Localized = Record<LangKey, string>;
const loc = (v?: Partial<Localized> | null): Localized => ({ en: v?.en ?? '', mr: v?.mr ?? '', hi: v?.hi ?? '' });

export function MaterialFormModal({ initial, onClose, onSaved, onUnauthorized }: Props) {
  const [form, setForm] = useState(() => ({
    title: loc(initial?.title),
    subtitle: loc(initial?.subtitle),
    description: loc(initial?.description),
    slug: initial?.slug ?? '',
    exam: initial?.exam ?? 'MPSC',
    subject: initial?.subject ?? SUBJECT_OPTIONS[0],
    language: initial?.language ?? 'Marathi',
    materialType: initial?.materialType ?? 'PDF Notes',
    pages: String(initial?.pages ?? ''),
    originalPrice: initial && !initial.isFree ? String(initial.originalPrice) : '',
    discountedPrice: initial && !initial.isFree ? String(initial.discountedPrice) : '',
    rating: String(initial?.rating ?? '0'),
    reviewsCount: String(initial?.reviewsCount ?? '0'),
    sortOrder: String(initial?.sortOrder ?? '0'),
    isFree: initial?.isFree ?? false,
    featured: initial?.featured ?? false,
    bestseller: initial?.bestseller ?? false,
    isPublished: initial?.isPublished ?? true,
    coverImage: initial?.coverImage ?? '',
    fileUrl: initial?.fileUrl ?? '',
    fileName: initial?.fileName ?? '',
    fileSize: initial?.fileSize ?? '',
    tableOfContents: (initial?.tableOfContents ?? []).join('\n'),
    whatIsIncluded: (initial?.whatIsIncluded ?? ['High Resolution Digital PDF', 'Instant Download']).join('\n'),
    tags: (initial?.tags ?? []).join(', '),
  }));
  const [activeLang, setActiveLang] = useState<LangKey>('en');
  const [uploading, setUploading] = useState<null | 'cover' | 'pdf'>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  type Form = typeof form;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setLocalized = (key: 'title' | 'subtitle' | 'description', lang: LangKey, value: string) =>
    setForm((f) => ({ ...f, [key]: { ...f[key], [lang]: value } }));

  const handleError = (err: unknown) => {
    if (err instanceof AdminApiError && err.status === 401) return onUnauthorized();
    setError((err as Error).message);
  };

  // ---- uploads ----
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading('cover');
    try {
      set('coverImage', (await adminApi.upload(file, 'image')).ref);
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(null);
    }
  };

  const uploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading('pdf');
    try {
      const res = await adminApi.upload(file, 'pdf');
      setForm((f) => ({
        ...f,
        fileUrl: res.ref,
        fileName: res.originalName,
        fileSize: res.fileSize,
        // Page count is read from the PDF automatically
        pages: res.pageCount ? String(res.pageCount) : f.pages,
      }));
      if (!res.pageCount) setError('PDF uploaded, but its page count could not be read. Please enter it manually.');
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(null);
    }
  };

  // ---- submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.coverImage) return setError('Please upload a cover image or paste an https:// image URL.');
    if (!form.title.en.trim() && !form.title.mr.trim()) return setError('Please enter a title in English or Marathi.');
    if (!form.description.en.trim() && !form.description.mr.trim())
      return setError('Please enter a description in English or Marathi.');

    setSaving(true);
    const body = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      slug: form.slug.trim(),
      exam: form.exam,
      subject: form.subject,
      language: form.language,
      materialType: form.materialType,
      pages: Number(form.pages),
      isFree: form.isFree,
      discountedPrice: form.isFree ? 0 : Number(form.discountedPrice || 0),
      originalPrice: form.isFree || form.originalPrice === '' ? undefined : Number(form.originalPrice),
      rating: form.rating,
      reviewsCount: form.reviewsCount,
      sortOrder: form.sortOrder,
      featured: form.featured,
      bestseller: form.bestseller,
      isPublished: form.isPublished,
      coverImage: form.coverImage,
      samplePages: [], // preview is auto-generated from the PDF
      fileUrl: form.fileUrl,
      fileName: form.fileName,
      fileSize: form.fileSize,
      tableOfContents: form.tableOfContents,
      whatIsIncluded: form.whatIsIncluded,
      tags: form.tags,
    };
    try {
      const res = initial ? await adminApi.updateMaterial(initial.id, body) : await adminApi.createMaterial(body);
      onSaved(res.item, initial ? 'updated' : 'created');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const pdfIsStored = !!form.fileUrl && form.fileUrl.startsWith('pdfs/') && initial?.fileUrl === form.fileUrl;
  const busy = saving || !!uploading;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-form-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[94vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 id="material-form-title" className="text-base font-bold text-[#1E2653] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>{initial ? 'Edit Study Material' : 'Add Study Material'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6" noValidate>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3" role="alert">
              {error}
            </div>
          )}

          {/* ---------------- Content (per language) ---------------- */}
          <fieldset className="space-y-3">
            <legend className={legendCls}>Content</legend>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit" role="tablist" aria-label="Content language">
              {LANGS.map((l) => {
                const filled = !!form.title[l.key].trim();
                return (
                  <button
                    key={l.key}
                    type="button"
                    role="tab"
                    aria-selected={activeLang === l.key}
                    onClick={() => setActiveLang(l.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeLang === l.key ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {l.label}
                    <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${filled ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              English or Marathi is required. Empty languages fall back to English → Marathi on the website.
            </p>
            <div>
              <label htmlFor="m-title" className={labelCls}>Title ({activeLang.toUpperCase()})</label>
              <input id="m-title" value={form.title[activeLang]} onChange={(e) => setLocalized('title', activeLang, e.target.value)} className={inputCls} maxLength={255} />
            </div>
            <div>
              <label htmlFor="m-subtitle" className={labelCls}>Subtitle ({activeLang.toUpperCase()})</label>
              <input id="m-subtitle" value={form.subtitle[activeLang]} onChange={(e) => setLocalized('subtitle', activeLang, e.target.value)} className={inputCls} maxLength={255} />
            </div>
            <div>
              <label htmlFor="m-desc" className={labelCls}>Description ({activeLang.toUpperCase()})</label>
              <textarea id="m-desc" rows={4} value={form.description[activeLang]} onChange={(e) => setLocalized('description', activeLang, e.target.value)} className={inputCls} maxLength={4000} />
            </div>
          </fieldset>

          {/* ---------------- Classification ---------------- */}
          <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <legend className={legendCls}>Classification</legend>
            <div>
              <label htmlFor="m-exam" className={labelCls}>Exam</label>
              <select id="m-exam" value={form.exam} onChange={(e) => set('exam', e.target.value as Form['exam'])} className={inputCls}>
                {EXAM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="m-subject" className={labelCls}>Subject</label>
              <select id="m-subject" value={form.subject} onChange={(e) => set('subject', e.target.value as Form['subject'])} className={inputCls}>
                {SUBJECT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="m-lang" className={labelCls}>Medium</label>
              <select id="m-lang" value={form.language} onChange={(e) => set('language', e.target.value as Form['language'])} className={inputCls}>
                {LANGUAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="m-type" className={labelCls}>Type</label>
              <select id="m-type" value={form.materialType} onChange={(e) => set('materialType', e.target.value as Form['materialType'])} className={inputCls}>
                {MATERIAL_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </fieldset>

          {/* ---------------- Pricing ---------------- */}
          <fieldset className="grid grid-cols-3 gap-3">
            <legend className={legendCls}>Pricing & Size</legend>
            <label className="col-span-full flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} className="w-4 h-4 rounded-sm border-slate-300" />
              Free download (anyone can download the PDF)
            </label>
            <div>
              <label htmlFor="m-price" className={labelCls}>Selling price (₹)</label>
              <input id="m-price" type="number" min={1} disabled={form.isFree} value={form.isFree ? '' : form.discountedPrice} onChange={(e) => set('discountedPrice', e.target.value)} className={`${inputCls} font-mono`} placeholder={form.isFree ? 'Free' : ''} />
            </div>
            <div>
              <label htmlFor="m-mrp" className={labelCls}>MRP (₹, optional)</label>
              <input id="m-mrp" type="number" min={0} disabled={form.isFree} value={form.isFree ? '' : form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} className={`${inputCls} font-mono`} placeholder="Shows strike-through" />
            </div>
            <div>
              <label htmlFor="m-pages" className={labelCls}>Pages <span className="font-normal text-slate-400">(auto from PDF)</span></label>
              <input id="m-pages" type="number" min={1} value={form.pages} onChange={(e) => set('pages', e.target.value)} className={`${inputCls} font-mono`} />
            </div>
          </fieldset>

          {/* ---------------- Files ---------------- */}
          <fieldset className="space-y-4">
            <legend className={legendCls}>Files</legend>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Cover */}
              <div className="space-y-2">
                <span className={labelCls}>Cover image</span>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {form.coverImage ? (
                      <img src={adminPreviewUrl(form.coverImage)} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus-within:ring-2 focus-within:ring-blue-300">
                    {uploading === 'cover' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploading === 'cover' ? 'Uploading…' : form.coverImage ? 'Replace' : 'Upload'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadCover} disabled={!!uploading} />
                  </label>
                </div>
                <input
                  aria-label="Cover image URL"
                  value={form.coverImage.startsWith('temp/') ? '' : form.coverImage}
                  onChange={(e) => set('coverImage', e.target.value)}
                  className={`${inputCls} font-mono text-[11px]`}
                  placeholder={form.coverImage.startsWith('temp/') ? 'New image uploaded ✓' : '…or paste an https:// image URL'}
                />
              </div>

              {/* PDF */}
              <div className="space-y-2">
                <span className={labelCls}>Notes PDF</span>
                <p className="text-[11px] text-slate-500">
                  The first pages of this PDF are shown automatically as the free preview, followed by the payment prompt.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {form.fileUrl ? (
                    <div className="flex items-start gap-2 text-xs">
                      <FileText className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{form.fileName || form.fileUrl}</p>
                        <p className="text-[11px] text-slate-500">
                          {form.fileSize} {form.fileUrl.startsWith('temp/') && '• new, saved when you click Save'}
                        </p>
                      </div>
                      {pdfIsStored && initial && (
                        <a href={adminApi.materialFileUrl(initial.id, true)} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-0.5 shrink-0">
                          View <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, fileUrl: '', fileName: '', fileSize: '' }))} className="text-slate-400 hover:text-rose-600 shrink-0" aria-label="Remove PDF">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">No PDF yet. {form.isFree ? 'Free materials need a PDF to be downloadable.' : 'Buyers download this after purchase.'}</p>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer focus-within:ring-2 focus-within:ring-blue-300">
                    {uploading === 'pdf' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploading === 'pdf' ? 'Uploading…' : form.fileUrl ? 'Replace PDF' : 'Upload PDF'}</span>
                    <input type="file" accept="application/pdf" className="sr-only" onChange={uploadPdf} disabled={!!uploading} />
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* ---------------- Details ---------------- */}
          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className={legendCls}>Details</legend>
            <div>
              <label htmlFor="m-toc" className={labelCls}>Table of contents (one chapter per line)</label>
              <textarea id="m-toc" rows={5} value={form.tableOfContents} onChange={(e) => set('tableOfContents', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="m-included" className={labelCls}>What&apos;s included (one per line)</label>
              <textarea id="m-included" rows={5} value={form.whatIsIncluded} onChange={(e) => set('whatIsIncluded', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-full">
              <label htmlFor="m-tags" className={labelCls}>Search tags (comma separated)</label>
              <input id="m-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputCls} placeholder="MPSC, Polity, Prelims" />
            </div>
          </fieldset>

          {/* ---------------- Visibility & display ---------------- */}
          <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <legend className={legendCls}>Visibility & Display</legend>
            <div className="col-span-full flex flex-wrap gap-4">
              {([
                ['isPublished', 'Published (visible on website)'],
                ['featured', 'Featured on homepage'],
                ['bestseller', 'Bestseller badge'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 rounded-sm border-slate-300" />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <label htmlFor="m-sort" className={labelCls}>Display order</label>
              <input id="m-sort" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={`${inputCls} font-mono`} aria-describedby="m-sort-help" />
              <p id="m-sort-help" className="text-[10px] text-slate-400 mt-0.5">Lower shows first</p>
            </div>
            <div>
              <label htmlFor="m-rating" className={labelCls}>Rating (0–5)</label>
              <input id="m-rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set('rating', e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label htmlFor="m-reviews" className={labelCls}>Ratings count</label>
              <input id="m-reviews" type="number" min={0} value={form.reviewsCount} onChange={(e) => set('reviewsCount', e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label htmlFor="m-slug" className={labelCls}>URL slug</label>
              <input id="m-slug" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} className={`${inputCls} font-mono`} placeholder="auto from title" maxLength={120} />
            </div>
          </fieldset>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              {initial ? 'Save Changes' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
