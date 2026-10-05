import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from './adminAuth';
import { apiError } from './apiErrors';

type Params = Record<string, string>;
type Handler<P extends Params> = (req: NextRequest, params: P) => Promise<Response | unknown>;

/**
 * Wraps an admin route: enforces the admin session + same-origin check, resolves params,
 * returns plain objects as JSON and maps thrown errors to safe HTTP responses.
 */
export function adminRoute<P extends Params = Params>(handler: Handler<P>, status = 200) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    const denied = await requireAdmin(req);
    if (denied) return denied;
    try {
      const out = await handler(req, ctx?.params ? await ctx.params : ({} as P));
      return out instanceof Response ? out : NextResponse.json(out, { status });
    } catch (err) {
      return apiError(err);
    }
  };
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
