import { NextResponse } from 'next/server';
import { getPublishedMaterials } from '@/lib/server/content';
import { apiError } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';

/** Public JSON list of published study materials (same data the website renders). */
export async function GET() {
  try {
    return NextResponse.json({ items: await getPublishedMaterials() });
  } catch (err) {
    return apiError(err);
  }
}
