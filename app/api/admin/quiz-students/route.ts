import { adminRoute, csvResponse } from '@/lib/server/routeHelpers';
import { listQuizStudents, quizStudentsCsv, type StudentSort } from '@/lib/server/quiz/students';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Students directory built from the details collected before each quiz attempt.
 * Query: ?search=&sort=recent|name|attempts|best&limit=&offset=&format=csv
 */
export const GET = adminRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const search = sp.get('search') || '';

  if (sp.get('format') === 'csv') {
    const { filename, csv } = await quizStudentsCsv(search);
    return csvResponse(filename, csv);
  }

  return listQuizStudents({
    search,
    sort: (sp.get('sort') || 'recent') as StudentSort,
    limit: Number(sp.get('limit')) || 50,
    offset: Number(sp.get('offset')) || 0,
  });
});
