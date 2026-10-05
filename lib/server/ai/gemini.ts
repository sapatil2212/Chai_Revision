// Gemini client + document handling for admin AI features (server only).
import { GoogleGenAI, type Schema } from '@google/genai';
import { HttpError } from '../content';

/** Model is configurable; the default matches the one used by the AI assistant route. */
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
export const MAX_DOC_BYTES = Math.max(1, Number(process.env.MAX_AI_DOC_MB || 20)) * 1024 * 1024;

export function geminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new HttpError(503, 'AI is not configured. Add GEMINI_API_KEY to .env and restart the server.');
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'chai-revision-admin' } } });
}

// -------------------------------------------------------------------------
// Document → Gemini parts
// -------------------------------------------------------------------------

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/** Types Gemini can read directly as binary. */
const NATIVE_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
};
/** Types we read as plain text ourselves. */
const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'tsv', 'json', 'rtf', 'htm', 'html', 'xml']);

export const SUPPORTED_DOC_HINT =
  'PDF, Word (.docx), images (PNG/JPG/WEBP) or text files (.txt, .md, .csv)';

function sniffKind(buf: Buffer, ext: string): 'pdf' | 'image' | 'docx' | 'text' | null {
  if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) return ext === 'docx' ? 'docx' : null; // zip container
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image';
  if (buf.length >= 6 && buf.toString('ascii', 0, 6) === 'GIF89a') return 'image';
  if (TEXT_EXTS.has(ext)) return 'text';
  return null;
}

/**
 * Converts an uploaded document into parts for Gemini.
 * PDFs and images are sent as-is; .docx is converted to text; text files are sent as text.
 */
export async function documentToParts(file: File): Promise<{ parts: Part[]; kind: string; chars?: number }> {
  if (file.size === 0) throw new HttpError(400, 'The file is empty.');
  if (file.size > MAX_DOC_BYTES) {
    throw new HttpError(400, `File too large (max ${Math.round(MAX_DOC_BYTES / 1024 / 1024)} MB).`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const kind = sniffKind(buf, ext);
  if (!kind) throw new HttpError(400, `Unsupported file type. Please upload ${SUPPORTED_DOC_HINT}.`);

  if (kind === 'pdf' || kind === 'image') {
    const mime = kind === 'pdf' ? 'application/pdf' : NATIVE_MIME[ext] || 'image/png';
    return { parts: [{ inlineData: { mimeType: mime, data: buf.toString('base64') } }], kind };
  }

  let text: string;
  if (kind === 'docx') {
    const mammoth = (await import('mammoth')).default;
    text = (await mammoth.extractRawText({ buffer: buf })).value;
  } else {
    text = buf.toString('utf8').replace(/<[^>]+>/g, ' '); // strip tags for html/xml
  }
  text = text.replace(/\u0000/g, '').trim();
  if (text.length < 20) {
    throw new HttpError(400, 'Could not read any text from this file. If it is a scanned document, upload it as a PDF or image instead.');
  }
  // Keep well inside the context window
  const MAX_CHARS = 400_000;
  const clipped = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n…[truncated]` : text;
  return { parts: [{ text: clipped }], kind, chars: text.length };
}

// -------------------------------------------------------------------------
// Structured generation
// -------------------------------------------------------------------------

/** Calls Gemini and parses a JSON response that matches `schema`. */
export async function generateJson<T>(opts: {
  systemInstruction: string;
  parts: Part[];
  schema: Schema;
  temperature?: number;
}): Promise<T> {
  const ai = geminiClient();
  let res;
  try {
    res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: opts.parts }],
      config: {
        systemInstruction: opts.systemInstruction,
        temperature: opts.temperature ?? 0.2,
        responseMimeType: 'application/json',
        responseSchema: opts.schema,
      },
    });
  } catch (err) {
    const msg = (err as Error).message || '';
    if (/API key|PERMISSION|UNAUTHENTICATED|401|403/i.test(msg)) {
      throw new HttpError(502, 'Gemini rejected the API key. Check GEMINI_API_KEY in .env.');
    }
    if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg)) {
      throw new HttpError(429, 'Gemini quota reached. Please try again in a few minutes.');
    }
    if (/deadline|timeout|ETIMEDOUT|fetch failed/i.test(msg)) {
      throw new HttpError(504, 'Gemini did not respond in time. Try a smaller document.');
    }
    console.error('[ai] generateContent failed:', msg);
    throw new HttpError(502, 'The AI service failed to process this document.');
  }

  const text = res.text?.trim();
  if (!text) throw new HttpError(502, 'The AI returned an empty response. Try again or use a clearer document.');
  try {
    return JSON.parse(text) as T;
  } catch {
    // Occasionally the model wraps JSON in prose or code fences
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    console.error('[ai] unparseable response:', text.slice(0, 500));
    throw new HttpError(502, 'The AI response could not be read. Please try again.');
  }
}
