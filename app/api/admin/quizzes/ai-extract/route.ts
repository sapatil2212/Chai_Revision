import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { apiError } from '@/lib/server/apiErrors';
import { HttpError } from '@/lib/server/content';
import { extractQuizFromDocument, MAX_AI_QUESTIONS, type Mode } from '@/lib/server/ai/quizExtract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Reading a long PDF can take a while
export const maxDuration = 300;

const MODES: Mode[] = ['metadata', 'questions', 'both'];

/**
 * Admin-only: reads an uploaded document with Gemini and returns a suggested quiz
 * plus extracted questions. Nothing is saved — the admin reviews it in the UI first.
 *
 * multipart/form-data: file, mode=metadata|questions|both, limit?, hint?, marks?, negativeMarks?
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
    if (!(file instanceof File)) throw new HttpError(400, 'Please choose a document to upload.');
    const modeRaw = String(form.get('mode') || 'both') as Mode;
    const mode = MODES.includes(modeRaw) ? modeRaw : 'both';
    const limit = Math.min(MAX_AI_QUESTIONS, Math.max(1, Number(form.get('limit')) || 50));
    const hint = String(form.get('hint') || '').slice(0, 500);
    const marks = Number(form.get('marks'));
    const negativeMarks = Number(form.get('negativeMarks'));

    const result = await extractQuizFromDocument({
      file,
      mode,
      limit,
      hint,
      defaults:
        Number.isFinite(marks) && marks > 0
          ? { marks, negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : 0.5 }
          : undefined,
    });

    // `inputs` is server-side validation detail; the client only needs the drafts
    const { inputs: _inputs, ...payload } = result;
    void _inputs;
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return apiError(err);
  }
}
