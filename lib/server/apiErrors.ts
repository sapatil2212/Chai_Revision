import { NextResponse } from 'next/server';
import { HttpError, NotFoundError, ValidationError } from './content';
import { StorageError } from './storage';

/** Map known errors to HTTP responses; never leak internal error details to the client. */
export function apiError(err: unknown): NextResponse {
  if (err instanceof ValidationError || err instanceof StorageError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message || 'Not found' }, { status: 404 });
  }
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  if (code === 'ER_DUP_ENTRY') {
    return NextResponse.json({ error: 'An item with the same slug or key already exists.' }, { status: 409 });
  }
  if (code === 'EACCES' || code === 'EPERM') {
    console.error('[storage] permission denied:', (err as Error).message);
    return NextResponse.json({ error: 'Server cannot write to the storage folder (permission denied).' }, { status: 500 });
  }
  console.error('[api]', err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw new ValidationError('Request body must be a JSON object');
}
