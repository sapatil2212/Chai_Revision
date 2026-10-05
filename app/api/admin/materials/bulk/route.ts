import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/adminAuth';
import { bulkUpdateMaterials, type BulkAction } from '@/lib/server/materials';
import { ValidationError } from '@/lib/server/content';
import { apiError, readJson } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';

const ACTIONS: BulkAction[] = ['publish', 'unpublish', 'feature', 'unfeature', 'delete'];

/** Body: { ids: string[], action: 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete' } */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJson(req);
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
    const action = body.action as BulkAction;
    if (!ACTIONS.includes(action)) throw new ValidationError(`action must be one of: ${ACTIONS.join(', ')}`);
    return NextResponse.json({ ok: true, ...(await bulkUpdateMaterials(ids, action)) });
  } catch (err) {
    return apiError(err);
  }
}
