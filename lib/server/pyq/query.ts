// Turns URL search params into a validated PyqQuery (shared by the admin and public routes).
import type { PyqQuery } from './common';

export function pyqQueryFromParams(sp: URLSearchParams): PyqQuery {
  const num = (key: string) => {
    const n = Number(sp.get(key));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const str = (key: string) => (sp.get(key) || '').trim().slice(0, 191) || undefined;

  return {
    exam: str('exam'),
    year: num('year'),
    subject: str('subject'),
    topic: str('topic'),
    source: str('source'),
    difficulty: str('difficulty'),
    search: str('search') ?? str('q'),
    limit: num('limit'),
    offset: Number(sp.get('offset')) > 0 ? Number(sp.get('offset')) : 0,
  };
}
