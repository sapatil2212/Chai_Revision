// File storage on the VPS disk (STORAGE_ROOT, e.g. /var/www/storage/chairevision).
//
// Lifecycle:
//   1. Admin uploads a file      -> saved to temp/ and referenced as "temp/<name>"
//   2. Admin saves the material  -> commit*() moves it to images/ or pdfs/
//   3. File replaced / deleted   -> deleteStoredFile() removes the old file
//   4. Abandoned temp uploads    -> purged after TEMP_FILE_TTL_HOURS
//
// Stored references:
//   images: "/api/media/images/<name>"  (public URL, served by app/api/media/images/[name])
//   pdfs:   "pdfs/<name>"               (private; streamed only by download routes)
import path from 'path';
import { createReadStream } from 'fs';
import { copyFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import { Readable } from 'stream';
import { randomBytes } from 'crypto';
import { PDFDocument } from 'pdf-lib';

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

const env = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

export const STORAGE_ROOT = path.resolve(env('STORAGE_ROOT', path.join(process.cwd(), 'storage')));

const DIRS = {
  images: env('STORAGE_DIR_IMAGES', 'images'),
  pdfs: env('STORAGE_DIR_PDFS', 'pdfs'),
  temp: env('STORAGE_DIR_TEMP', 'temp'),
  previews: env('STORAGE_DIR_PREVIEWS', 'previews'), // auto-generated first-N-page PDFs (public)
};

/** How many leading pages of a PDF visitors can preview before the paywall. */
export const PREVIEW_PAGES = Math.max(1, Math.min(10, Number(env('PREVIEW_PAGES', '2')) || 2));

export type UploadKind = 'image' | 'pdf';

const LIMITS: Record<UploadKind, number> = {
  image: Number(env('MAX_IMAGE_UPLOAD_MB', '5')) * 1024 * 1024,
  pdf: Number(env('MAX_PDF_UPLOAD_MB', '100')) * 1024 * 1024,
};

const TEMP_TTL_MS = Number(env('TEMP_FILE_TTL_HOURS', '24')) * 60 * 60 * 1000;

export const PUBLIC_IMAGE_PREFIX = '/api/media/images/';

/** Generated file names only: "<base36 time>-<16 hex>.<ext>". Anything else is rejected (blocks path traversal). */
const FILE_NAME_RE = /^[a-z0-9]+-[a-f0-9]{16}\.(jpg|png|webp|pdf)$/;
const IMAGE_EXTS = new Set(['jpg', 'png', 'webp']);

export const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

const extOf = (name: string) => name.split('.').pop() as string;
const dirPath = (dir: keyof typeof DIRS) => path.join(STORAGE_ROOT, DIRS[dir]);

export class StorageError extends Error {}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/** Detect file type from magic bytes. Never trust the client-supplied MIME type or extension. */
function sniff(buf: Buffer): { ext: string; kind: UploadKind } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', kind: 'image' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: 'png', kind: 'image' };
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return { ext: 'webp', kind: 'image' };
  if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') return { ext: 'pdf', kind: 'pdf' };
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Move within the storage volume; falls back to copy+delete if dirs are on different devices. */
async function moveFile(from: string, to: string) {
  try {
    await rename(from, to);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    await copyFile(from, to);
    await unlink(from);
  }
}

/** Sanitize a client file name for display / Content-Disposition. */
export function cleanFileName(name: string, fallbackExt: string): string {
  const base = path.basename(name || '').replace(/[^\p{L}\p{N}._ -]+/gu, '').trim().slice(0, 150);
  if (!base) return `document.${fallbackExt}`;
  return base.toLowerCase().endsWith(`.${fallbackExt}`) ? base : `${base}.${fallbackExt}`;
}

// -------------------------------------------------------------------------
// Upload (to temp/)
// -------------------------------------------------------------------------

export async function saveTempUpload(file: File, expected: UploadKind) {
  if (file.size === 0) throw new StorageError('File is empty');
  if (file.size > LIMITS[expected]) throw new StorageError(`File too large (max ${formatBytes(LIMITS[expected])})`);

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || type.kind !== expected) {
    throw new StorageError(expected === 'image' ? 'Only JPG, PNG or WEBP images are allowed' : 'Only PDF files are allowed');
  }

  // Read the page count so the admin doesn't have to type it
  const pageCount = type.kind === 'pdf' ? await countPdfPages(buf) : null;

  const name = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${type.ext}`;
  await mkdir(dirPath('temp'), { recursive: true });
  await writeFile(path.join(dirPath('temp'), name), buf);

  // Opportunistic cleanup of abandoned uploads (non-blocking)
  void purgeTempFiles().catch(() => {});

  return {
    kind: expected,
    ref: `temp/${name}`, // send this back when saving the material
    previewUrl: `/api/admin/media/temp/${name}`,
    size: buf.length,
    fileSize: formatBytes(buf.length),
    originalName: cleanFileName(file.name, type.ext),
    pageCount, // PDFs only; null if the PDF couldn't be parsed
  };
}

async function countPdfPages(buf: Buffer): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

export async function purgeTempFiles(maxAgeMs = TEMP_TTL_MS): Promise<number> {
  let removed = 0;
  let entries: string[] = [];
  try {
    entries = await readdir(dirPath('temp'));
  } catch {
    return 0;
  }
  const cutoff = Date.now() - maxAgeMs;
  for (const name of entries) {
    if (!FILE_NAME_RE.test(name)) continue;
    const full = path.join(dirPath('temp'), name);
    try {
      if ((await stat(full)).mtimeMs < cutoff) {
        await unlink(full);
        removed++;
      }
    } catch {
      /* already gone */
    }
  }
  return removed;
}

// -------------------------------------------------------------------------
// Reference parsing & commit (temp/ -> images/ | pdfs/)
// -------------------------------------------------------------------------

export function isTempRef(ref: string, kind?: UploadKind): boolean {
  const m = /^temp\/(.+)$/.exec(ref);
  if (!m || !FILE_NAME_RE.test(m[1])) return false;
  if (!kind) return true;
  return kind === 'pdf' ? extOf(m[1]) === 'pdf' : IMAGE_EXTS.has(extOf(m[1]));
}

export function isStoredImageRef(ref: string): boolean {
  if (!ref.startsWith(PUBLIC_IMAGE_PREFIX)) return false;
  const name = ref.slice(PUBLIC_IMAGE_PREFIX.length);
  return FILE_NAME_RE.test(name) && IMAGE_EXTS.has(extOf(name));
}

export function isStoredPdfRef(ref: string): boolean {
  const m = /^pdfs\/(.+)$/.exec(ref);
  return !!m && FILE_NAME_RE.test(m[1]) && extOf(m[1]) === 'pdf';
}

async function commitTemp(ref: string, target: 'images' | 'pdfs'): Promise<string> {
  const name = ref.slice('temp/'.length);
  const from = path.join(dirPath('temp'), name);
  await mkdir(dirPath(target), { recursive: true });
  try {
    await moveFile(from, path.join(dirPath(target), name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new StorageError('Uploaded file expired or not found. Please upload it again.');
    }
    throw err;
  }
  return name;
}

/** Image ref -> permanent public URL. External https URLs and existing stored images pass through. */
export async function commitImage(ref: string): Promise<string> {
  if (isTempRef(ref, 'image')) return PUBLIC_IMAGE_PREFIX + (await commitTemp(ref, 'images'));
  return ref;
}

/** PDF ref -> permanent private path "pdfs/<name>". */
export async function commitPdf(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  if (isTempRef(ref, 'pdf')) return `pdfs/${await commitTemp(ref, 'pdfs')}`;
  return ref;
}

/** Delete a file we own. External URLs and bundled /images/* assets are ignored. */
export async function deleteStoredFile(ref: string | null | undefined): Promise<void> {
  if (!ref) return;
  let full: string | null = null;
  if (isStoredImageRef(ref)) full = path.join(dirPath('images'), ref.slice(PUBLIC_IMAGE_PREFIX.length));
  else if (isStoredPdfRef(ref)) full = path.join(dirPath('pdfs'), ref.slice('pdfs/'.length));
  else if (isTempRef(ref)) full = path.join(dirPath('temp'), ref.slice('temp/'.length));
  if (!full) return;
  const targets = [full];
  // A stored PDF may also have a generated preview
  if (isStoredPdfRef(ref)) targets.push(path.join(dirPath('previews'), ref.slice('pdfs/'.length)));
  await Promise.all(targets.map((t) => unlink(t).catch(() => {})));
}

// -------------------------------------------------------------------------
// Auto-generated preview (first PREVIEW_PAGES pages of a stored PDF)
// -------------------------------------------------------------------------

/**
 * Returns a small PDF containing only the first pages of the stored PDF, generated once and cached on disk.
 * Never includes the whole document: a PDF with ≤ PREVIEW_PAGES pages previews one page less (min 1 hidden).
 * Returns null if the PDF can't be parsed or has nothing previewable.
 */
export async function getPreviewPdf(ref: string): Promise<{ data: Buffer; previewPages: number; totalPages: number } | null> {
  if (!isStoredPdfRef(ref)) return null;
  const name = ref.slice('pdfs/'.length);
  const cachePath = path.join(dirPath('previews'), name);

  try {
    const data = await readFile(cachePath);
    const doc = await PDFDocument.load(data, { updateMetadata: false });
    const total = Number(doc.getSubject()?.match(/^total:(\d+)$/)?.[1]) || 0;
    return { data, previewPages: doc.getPageCount(), totalPages: total };
  } catch {
    /* not cached yet */
  }

  let source: PDFDocument;
  try {
    source = await PDFDocument.load(await readFile(path.join(dirPath('pdfs'), name)), {
      ignoreEncryption: true,
      updateMetadata: false,
    });
  } catch {
    return null;
  }

  const total = source.getPageCount();
  const count = total > PREVIEW_PAGES ? PREVIEW_PAGES : total - 1;
  if (count < 1) return null;

  const preview = await PDFDocument.create();
  const pages = await preview.copyPages(source, Array.from({ length: count }, (_, i) => i));
  pages.forEach((p) => preview.addPage(p));
  preview.setTitle('Chai Revision — Sample Preview');
  preview.setSubject(`total:${total}`); // remembered for cached reads
  preview.setProducer('Chai Revision');
  const data = Buffer.from(await preview.save());

  // Write atomically so concurrent requests never read a half-written file
  await mkdir(dirPath('previews'), { recursive: true });
  const tmp = `${cachePath}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, cachePath).catch(() => unlink(tmp).catch(() => {}));

  return { data, previewPages: count, totalPages: total };
}

// -------------------------------------------------------------------------
// Reading
// -------------------------------------------------------------------------

async function readNamed(dir: keyof typeof DIRS, name: string, allowExt: (ext: string) => boolean) {
  if (!FILE_NAME_RE.test(name) || !allowExt(extOf(name))) return null;
  try {
    const data = await readFile(path.join(dirPath(dir), name));
    return { data, mime: MIME[extOf(name)] };
  } catch {
    return null;
  }
}

export const readPublicImage = (name: string) => readNamed('images', name, (e) => IMAGE_EXTS.has(e));

/** Admin-only preview of an uploaded-but-unsaved file. */
export const readTempFile = (name: string) => readNamed('temp', name, () => true);

/** Open a stored PDF ("pdfs/<name>") as a web stream for download responses. */
export async function openPdf(ref: string): Promise<{ stream: ReadableStream; size: number } | null> {
  if (!isStoredPdfRef(ref)) return null;
  const full = path.join(dirPath('pdfs'), ref.slice('pdfs/'.length));
  try {
    const { size } = await stat(full);
    const stream = Readable.toWeb(createReadStream(full)) as unknown as ReadableStream;
    return { stream, size };
  } catch {
    return null;
  }
}

/** Response for a PDF download with safe headers. */
export function pdfResponse(file: { stream: ReadableStream; size: number }, downloadName: string, inline = false) {
  const ascii = downloadName.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return new Response(file.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Startup/diagnostic check that the storage folders exist and are writable. */
export async function checkStorage() {
  const results: Record<string, string> = {};
  for (const key of Object.keys(DIRS) as (keyof typeof DIRS)[]) {
    const dir = dirPath(key);
    try {
      await mkdir(dir, { recursive: true });
      const probe = path.join(dir, `.write-test-${randomBytes(4).toString('hex')}`);
      await writeFile(probe, 'ok');
      await unlink(probe);
      results[key] = `ok (${dir})`;
    } catch (err) {
      results[key] = `NOT WRITABLE (${dir}): ${(err as Error).message}`;
    }
  }
  return results;
}
