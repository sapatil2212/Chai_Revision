import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { saveTempUpload, type UploadKind } from '@/lib/server/storage';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';

/**
 * multipart/form-data: file=<File>, kind=image|pdf
 * Saves to the temp folder. The returned `ref` becomes permanent only when a material is saved with it.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  const kind = form.get('kind');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });
  if (kind !== 'image' && kind !== 'pdf') return NextResponse.json({ error: 'kind must be image or pdf' }, { status: 400 });

  try {
    return NextResponse.json(await saveTempUpload(file, kind as UploadKind), { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
