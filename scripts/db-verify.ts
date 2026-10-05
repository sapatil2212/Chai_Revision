import { sql, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { STUDY_MATERIALS_DATA } from '../lib/data';

const tables = [
  'exam_categories', 'materials', 'pyqs', 'quiz_sets', 'quiz_questions', 'exam_updates',
  'important_dates', 'blog_posts', 'coupons', 'users', 'orders', 'order_items',
  'bookmarks', 'notifications', 'quiz_attempts',
];

async function main() {
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const [rows] = (await db.execute(sql.raw(`SELECT COUNT(*) AS n FROM \`${t}\``))) as unknown as [{ n: number }[]];
    counts[t] = Number(rows[0].n);
  }
  console.table(counts);

  const mat = await db.query.materials.findFirst({ where: eq(schema.materials.id, 'mat-1') });
  const source = STUDY_MATERIALS_DATA.find((m) => m.id === 'mat-1');
  console.log('mat-1 Marathi title matches source exactly:', mat?.title.mr === source?.title.mr);
  const quiz = await db.query.quizSets.findFirst({ with: { questions: true } });
  console.log('first quiz:', quiz?.id, 'questions:', quiz?.questions.length);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
