// Client-safe helpers for study material links.
import type { Product } from './types';

/** Public PDF download URL (works for free + published materials with an uploaded PDF). */
export const materialDownloadUrl = (slug: string, inline = false) =>
  `/api/materials/${encodeURIComponent(slug)}/download${inline ? '?inline=1' : ''}`;

/** True when visitors can download this material right now without purchase. */
export const canDownloadFree = (p: Pick<Product, 'isFree' | 'hasFile'>) => !!p.isFree && !!p.hasFile;
