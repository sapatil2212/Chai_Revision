// End-to-end check of admin auth, study-material CRUD + file lifecycle, and public reflection.
// Usage: node --env-file=.env scripts/e2e-admin.mjs [baseUrl] [--rate-limit]
// Set E2E_STORAGE_ROOT to the server's STORAGE_ROOT to also verify files on disk.
import { existsSync } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3100';
const ORIGIN = { Origin: BASE };
const DISK = process.env.E2E_STORAGE_ROOT || '';
let cookie = '';
let failures = 0;

const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) failures++;
};

async function call(p, { method = 'GET', body, headers = {}, auth = true, form } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      ...(form ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
    redirect: 'manual',
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const text = buf.toString('utf8');
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, buf, headers: res.headers };
}

const homepage = async () => (await call('/', { auth: false })).text;
const onDisk = (rel) => (DISK ? existsSync(path.join(DISK, rel)) : null);
const imgName = (url) => url.split('/').pop();

// 1x1 PNG and real PDFs with a known number of pages
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
async function makePdf(pages) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 420]).drawText(`Page ${i + 1}`, { x: 40, y: 380, size: 24 });
  return Buffer.from(await doc.save());
}
const PDF = await makePdf(5);
const PDF_TWO_PAGES = await makePdf(2);
const pagesIn = async (buf) => (await PDFDocument.load(buf)).getPageCount();

const upload = (buf, name, type, kind) => {
  const form = new FormData();
  form.append('file', new Blob([buf], { type }), name);
  form.append('kind', kind);
  return call('/api/admin/upload', { method: 'POST', form, headers: ORIGIN });
};
const api = (p, method, body) => call(p, { method, headers: ORIGIN, body });

// ======================= Auth =======================
check('admin API rejects anonymous', (await call('/api/admin/materials', { auth: false })).status === 401);
check('wrong password rejected', (await api('/api/admin/login', 'POST', { email: process.env.ADMIN_USER, password: 'nope' })).status === 401);
check('login without Origin blocked', (await call('/api/admin/login', { method: 'POST', body: { email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS } })).status === 403);

const login = await api('/api/admin/login', 'POST', { email: process.env.ADMIN_USER.toUpperCase(), password: process.env.ADMIN_PASS });
const setCookie = login.headers.get('set-cookie') || '';
cookie = setCookie.split(';')[0];
check('correct login succeeds', login.status === 200 && cookie.startsWith('cr_admin_session='));
check('cookie is HttpOnly + SameSite=Strict', /HttpOnly/i.test(setCookie) && /SameSite=Strict/i.test(setCookie));
const realCookie = cookie;
cookie = realCookie.slice(0, -3) + 'abc';
check('tampered cookie rejected', (await call('/api/admin/session')).status === 401);
cookie = realCookie;
check('mutation without Origin blocked (CSRF)', (await call('/api/admin/materials', { method: 'POST', body: {} })).status === 403);

// ======================= Storage =======================
const storage = await call('/api/admin/storage');
check('storage folders writable', storage.json?.healthy === true, storage.json?.root);

// ======================= Uploads (temp) =======================
const cover = await upload(PNG, 'cover.png', 'image/png', 'image');
check('image upload goes to temp/', cover.status === 201 && /^temp\//.test(cover.json?.ref), cover.json?.ref);
check('temp preview requires admin', (await call(cover.json.previewUrl, { auth: false })).status === 401);
check('temp preview works for admin', (await call(cover.json.previewUrl)).status === 200);
const sample1 = await upload(PNG, 's1.png', 'image/png', 'image');
const sample2 = await upload(PNG, 's2.png', 'image/png', 'image');
check('PDF disguised as image rejected', (await upload(PDF, 'x.png', 'image/png', 'image')).status === 400);
const pdf = await upload(PDF, 'Economy Notes.pdf', 'application/pdf', 'pdf');
check('PDF upload works', pdf.status === 201 && /^temp\/.+\.pdf$/.test(pdf.json?.ref) && pdf.json.originalName === 'Economy Notes.pdf');
check('PDF page count detected automatically', pdf.json?.pageCount === 5, String(pdf.json?.pageCount));
check('path traversal on media route blocked', (await call('/api/media/images/..%2F..%2F.env', { auth: false })).status === 404);

// ======================= Validation =======================
const marker = `E2E ${Date.now()}`;
const base = {
  title: { en: `${marker} Economy Notes`, mr: `${marker} अर्थव्यवस्था नोट्स` },
  description: { en: 'E2E test material', mr: 'चाचणी' },
  exam: 'MPSC', subject: 'Indian Economy', language: 'Bilingual', materialType: 'Short Notes',
  pages: 42, originalPrice: 199, discountedPrice: 129,
};
check('javascript: cover URL rejected', (await api('/api/admin/materials', 'POST', { ...base, coverImage: 'javascript:alert(1)' })).status === 400);
check('unknown exam rejected', (await api('/api/admin/materials', 'POST', { ...base, exam: 'Fake', coverImage: cover.json.ref })).status === 400);
check('paid with ₹0 rejected', (await api('/api/admin/materials', 'POST', { ...base, discountedPrice: 0, originalPrice: 0, coverImage: cover.json.ref })).status === 400);
check('bad slug rejected', (await api('/api/admin/materials', 'POST', { ...base, slug: 'Bad Slug!', coverImage: cover.json.ref })).status === 400);

// ======================= Create (paid) =======================
const created = await api('/api/admin/materials', 'POST', {
  ...base,
  featured: true, rating: 4.7, reviewsCount: 12, sortOrder: -5,
  coverImage: cover.json.ref,
  samplePages: [sample1.json.ref, sample2.json.ref],
  fileUrl: pdf.json.ref, fileName: pdf.json.originalName, fileSize: pdf.json.fileSize,
  tableOfContents: 'Chapter 1\nChapter 2', tags: 'MPSC, Economy',
});
const mat = created.json?.item;
check('material created', created.status === 201 && mat?.id, created.json?.error || mat?.id);
check('cover moved to permanent public URL', mat?.coverImage?.startsWith('/api/media/images/'));
check('sample pages committed in order', mat?.samplePages?.length === 2 && mat.samplePages.every((s) => s.startsWith('/api/media/images/')));
check('PDF moved to private pdfs/', /^pdfs\/.+\.pdf$/.test(mat?.fileUrl || ''));
check('temp files removed after commit', DISK ? !onDisk(cover.json.ref) && !onDisk(pdf.json.ref) : true);
check('files present on disk', DISK ? onDisk(`images/${imgName(mat.coverImage)}`) && onDisk(mat.fileUrl) : true);
check('Marathi title stored intact', mat?.title.mr === `${marker} अर्थव्यवस्था नोट्स`);
check('rating / order / tags stored', mat?.rating === 4.7 && mat?.sortOrder === -5 && mat?.tags.join('|') === 'MPSC|Economy');
check('re-using a consumed temp ref fails cleanly', (await api('/api/admin/materials', 'POST', { ...base, coverImage: cover.json.ref })).status === 400);

const coverServed = await call(mat.coverImage, { auth: false });
check('cover publicly served', coverServed.status === 200 && coverServed.headers.get('content-type') === 'image/png');

let html = await homepage();
check('new material appears on homepage immediately (cache revalidated)', html.includes(`${marker} Economy Notes`));
check('private PDF path not exposed publicly', !html.includes(mat.fileUrl));
const publicList = await call('/api/materials', { auth: false });
const pub = publicList.json?.items?.find((x) => x.id === mat.id);
check('public API lists it first (sort order) with hasFile', publicList.json?.items?.[0]?.id === mat.id && pub?.hasFile === true && !('fileUrl' in pub));
// downloadCount is shown as social proof on the Free Resources page
check('public API exposes downloadCount but never the storage path', pub?.downloadCount === 0 && !('fileUrl' in pub) && !('fileName' in pub), JSON.stringify(pub?.downloadCount));

check('paid PDF not publicly downloadable', (await call(`/api/materials/${mat.slug}/download`, { auth: false })).status === 403);

// ---- Auto preview: first 2 pages only ----
const prev = await call(`/api/materials/${mat.slug}/preview`, { auth: false });
check('public preview served as PDF', prev.status === 200 && prev.headers.get('content-type') === 'application/pdf');
check('preview contains only the first 2 pages', prev.status === 200 && (await pagesIn(prev.buf)) === 2);
check('preview headers report 2 of 5 pages', prev.headers.get('x-preview-pages') === '2' && prev.headers.get('x-total-pages') === '5');
check('preview cached on disk', DISK ? onDisk(`previews/${mat.fileUrl.slice(5)}`) : true);
const prevAgain = await call(`/api/materials/${mat.slug}/preview`, { auth: false });
check('cached preview still reports totals', prevAgain.headers.get('x-total-pages') === '5' && (await pagesIn(prevAgain.buf)) === 2);
const adminPdf = await call(`/api/admin/materials/${mat.id}/file`);
check('admin can download the PDF', adminPdf.status === 200 && adminPdf.buf.toString('ascii', 0, 5) === '%PDF-');
check('admin PDF keeps original file name', /Economy Notes\.pdf/.test(adminPdf.headers.get('content-disposition') || ''));

// ======================= Update =======================
const priced = await api(`/api/admin/materials/${mat.id}`, 'PATCH', { discountedPrice: 79 });
check('price PATCH keeps other fields', priced.json?.item?.discountedPrice === 79 && priced.json.item.pages === 42 && priced.json.item.samplePages.length === 2);
check('price above MRP rejected', (await api(`/api/admin/materials/${mat.id}`, 'PATCH', { discountedPrice: 999 })).status === 400);

const oldCover = mat.coverImage;
const newCoverUp = await upload(PNG, 'c2.png', 'image/png', 'image');
const replaced = await api(`/api/admin/materials/${mat.id}`, 'PATCH', { coverImage: newCoverUp.json.ref, samplePages: [mat.samplePages[1]] });
check('cover replaced', replaced.json?.item?.coverImage !== oldCover && replaced.json?.item?.samplePages.length === 1, replaced.json?.error);
check('old cover + removed sample deleted from disk', DISK ? !onDisk(`images/${imgName(oldCover)}`) && !onDisk(`images/${imgName(mat.samplePages[0])}`) : true);
check('kept sample page still on disk', DISK ? onDisk(`images/${imgName(mat.samplePages[1])}`) : true);

// Replacing the PDF with a 2-page one: preview must never expose the whole document
const oldPdfRef = replaced.json.item.fileUrl;
const twoUp = await upload(PDF_TWO_PAGES, 'short.pdf', 'application/pdf', 'pdf');
const swapped = await api(`/api/admin/materials/${mat.id}`, 'PATCH', { fileUrl: twoUp.json.ref, fileName: 'short.pdf', fileSize: twoUp.json.fileSize, pages: twoUp.json.pageCount });
check('PDF replaced', swapped.json?.item?.fileUrl && swapped.json.item.fileUrl !== oldPdfRef && swapped.json.item.pages === 2, swapped.json?.error);
check('old PDF + its preview deleted from disk', DISK ? !onDisk(oldPdfRef) && !onDisk(`previews/${oldPdfRef.slice(5)}`) : true);
const shortPrev = await call(`/api/materials/${mat.slug}/preview`, { auth: false });
check('2-page PDF previews only 1 page', shortPrev.status === 200 && (await pagesIn(shortPrev.buf)) === 1);

// Switch to free -> public download works and counts
const freed = await api(`/api/admin/materials/${mat.id}`, 'PATCH', { isFree: true });
check('switch to free', freed.json?.item?.isFree === true && freed.json.item.discountedPrice === 0);
const dl = await call(`/api/materials/${mat.slug}/download`, { auth: false });
check('free PDF publicly downloadable', dl.status === 200 && dl.buf.toString('ascii', 0, 5) === '%PDF-' && /attachment/.test(dl.headers.get('content-disposition') || ''));
await new Promise((r) => setTimeout(r, 400));
const after = await call(`/api/admin/materials/${mat.id}`);
check('download counted', after.json?.item?.downloadCount >= 1);
const freeList = await call('/api/materials', { auth: false });
const freePub = freeList.json?.items?.find((x) => x.id === mat.id);
check('free material is downloadable from the public catalogue', freePub?.isFree === true && freePub?.hasFile === true);
check('public download count visible to students', freePub?.downloadCount >= 1, String(freePub?.downloadCount));

// ======================= Duplicate + bulk =======================
const dup = await call(`/api/admin/materials/${mat.id}/duplicate`, { method: 'POST', headers: ORIGIN });
const copy = dup.json?.item;
check('duplicate created as draft', dup.status === 201 && copy?.isPublished === false && copy.slug !== mat.slug);
const bulk = await api('/api/admin/materials/bulk', 'POST', { ids: [mat.id, copy.id], action: 'unpublish' });
check('bulk unpublish', bulk.json?.affected === 2);
html = await homepage();
check('unpublished material hidden from site', !html.includes(`${marker} Economy Notes`));
check('unpublished material not downloadable', (await call(`/api/materials/${mat.slug}/download`, { auth: false })).status === 404);
check('unpublished material has no public preview', (await call(`/api/materials/${mat.slug}/preview`, { auth: false })).status === 404);

const finalFiles = (await call(`/api/admin/materials/${mat.id}`)).json.item;
check('delete copy keeps shared files', (await api(`/api/admin/materials/${copy.id}`, 'DELETE')).json?.archived === false && (DISK ? onDisk(finalFiles.fileUrl) : true));

// ======================= Exam updates (regression) =======================
const upd = await api('/api/admin/updates', 'POST', {
  title: { en: `${marker} Hall Ticket Released` }, exam: 'MPSC', category: 'Admit Card', badge: 'ADMIT CARD',
  shortSummary: { en: 'Download now' }, officialLink: 'https://mpsc.gov.in',
});
check('exam update created', upd.status === 201, upd.json?.error);
html = await homepage();
check('exam update on homepage immediately', html.includes(`${marker} Hall Ticket Released`));
check('delete exam update', (await api(`/api/admin/updates/${upd.json.item.id}`, 'DELETE')).status === 200);

// ======================= Dashboard stats (live, no placeholder numbers) =======================
check('stats API rejects anonymous', (await call('/api/admin/stats', { auth: false })).status === 401);
const st = (await call('/api/admin/stats')).json;
check('stats returns every section', !!st && !!st.materials && !!st.pyqs && !!st.quizzes && !!st.updates && !!st.attempts && !!st.students && !!st.revenue, JSON.stringify(Object.keys(st || {})));
check('material counts are real and self-consistent', st.materials.total >= 1 && st.materials.published + st.materials.drafts === st.materials.total, JSON.stringify(st.materials));
check('download counter surfaced on the dashboard', st.materials.downloads >= 1, String(st.materials.downloads));
check('PYQ counts match the seeded bank', st.pyqs.total >= 4 && st.pyqs.years >= 1, JSON.stringify(st.pyqs));
check('quiz counts include question totals', st.quizzes.total >= 1 && st.quizzes.questions >= 1, JSON.stringify(st.quizzes));
check('attempt figures are consistent', st.attempts.submitted + st.attempts.inProgress === st.attempts.total && st.attempts.avgPercentage >= 0 && st.attempts.passRate >= 0, JSON.stringify(st.attempts));
check('revenue is reported honestly, not invented', st.revenue.rupees === 0 && st.revenue.orders === 0 && st.revenue.live === false, JSON.stringify(st.revenue));
check('trend is a zero-filled 7-day series', Array.isArray(st.trend) && st.trend.length === st.trendDays && st.trend.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isInteger(d.attempts)), JSON.stringify(st.trend?.slice(0, 2)));
check('recent activity is a sorted feed', Array.isArray(st.recent) && st.recent.every((r) => r.title && r.at) && st.recent.every((r, i, a) => i === 0 || a[i - 1].at >= r.at), JSON.stringify(st.recent?.[0]));
check('this run\'s material shows up in recent activity', st.recent.some((r) => r.title.includes(marker)), st.recent.map((r) => r.kind).join(','));
check('upcoming items are shaped for the UI', Array.isArray(st.upcoming) && st.upcoming.every((u) => u.title && u.label));
check('stats are timestamped so the UI can show freshness', !!st.generatedAt && Date.now() - new Date(st.generatedAt).getTime() < 60_000);

// ======================= Delete + cleanup =======================
check('delete material', (await api(`/api/admin/materials/${mat.id}`, 'DELETE')).json?.archived === false);
check('all material files removed from disk', DISK
  ? !onDisk(finalFiles.fileUrl) && !onDisk(`previews/${finalFiles.fileUrl.slice(5)}`) && !onDisk(`images/${imgName(finalFiles.coverImage)}`) && finalFiles.samplePages.every((s) => !onDisk(`images/${imgName(s)}`))
  : true);
check('deleted material returns 404', (await call(`/api/admin/materials/${mat.id}`)).status === 404);
const purge = await call('/api/admin/storage', { method: 'DELETE', headers: ORIGIN });
check('temp purge endpoint works', purge.status === 200);

// ======================= Logout =======================
const out = await api('/api/admin/logout', 'POST');
check('logout clears cookie', /cr_admin_session=;/.test(out.headers.get('set-cookie') || ''));

// ======================= Rate limiting (locks this IP for 15 min) =======================
if (process.argv.includes('--rate-limit')) {
  let last = 0;
  for (let i = 0; i < 6; i++) {
    last = (await call('/api/admin/login', { method: 'POST', headers: ORIGIN, auth: false, body: { email: 'x@y.z', password: 'bad' } })).status;
  }
  check('brute force throttled after 5 failures', last === 429);
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
