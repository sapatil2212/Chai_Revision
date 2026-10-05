import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { apiError } from '@/lib/server/apiErrors';
import { HttpError } from '@/lib/server/content';
import { MAX_AI_PYQS, extractPyqsFromDocument, type PyqOverrides } from '@/lib/server/ai/pyqExtract';
import { EXAM_OPTIONS, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { PYQ_YEAR_MIN, pyqYearMax } from '@/lib/pyqTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A full question paper can take a while to read
export const maxDuration = 300;

/**
 * Admin-only: reads a previous-year question paper with Gemini and returns tagged
 * PYQ drafts. Nothing is saved — the admin reviews them in the UI first.
 *
 * multipart/form-data: file, limit?, hint?, exam?, year?, subject?, source?
 * The optional exam/year/subject/source override whatever the model detects.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new HttpError(400, 'Expected multipart/form-data with a file.');
    }

    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Please choose a question paper to upload.');

    const text = (key: string, max: number) => String(form.get(key) || '').trim().slice(0, max);
    const year = Number(form.get('year'));
    const exam = text('exam', 64);
    const subject = text('subject', 64);

    const overrides: PyqOverrides = {
      exam: EXAM_OPTIONS.includes(exam) ? exam : undefined,
      year: Number.isInteger(year) && year >= PYQ_YEAR_MIN && year <= pyqYearMax() ? year : undefined,
      subject: SUBJECT_OPTIONS.includes(subject) ? subject : undefined,
      source: text('source', 150) || undefined,
    };

    const result = await extractPyqsFromDocument({
      file,
      limit: Math.min(MAX_AI_PYQS, Math.max(1, Number(form.get('limit')) || 60)),
      hint: text('hint', 500),
      overrides,
    });

    // `inputs` is server-side validation detail; the client only needs the drafts
    const { inputs: _inputs, ...payload } = result;
    void _inputs;
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
