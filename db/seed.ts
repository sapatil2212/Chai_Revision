// Seeds catalog/content tables from the existing static data in lib/.
// Idempotent: re-running updates existing rows by primary key.
// Usage: npm run db:seed
import { sql, getTableColumns, type InferInsertModel } from 'drizzle-orm';
import type { MySqlTable } from 'drizzle-orm/mysql-core';
import { db, schema } from './index';
import {
  EXAM_CATEGORIES_DATA,
  STUDY_MATERIALS_DATA,
  PYQS_DATA,
  EXAM_UPDATES_DATA,
  IMPORTANT_DATES_DATA,
  BLOG_POSTS_DATA,
} from '../lib/data';
import { QUIZ_SETS_DATA } from '../lib/quizData';

const SEED_SUBJECT_MAP: Record<string, string> = {
  'Maharashtra Geography': 'Maharashtra & World Geography',
  'Maharashtra History': 'Maharashtra & Indian History',
};

/** Bulk insert; on duplicate PK/unique key, overwrite every column except keys and created_at. */
async function upsert<T extends MySqlTable>(table: T, rows: InferInsertModel<T>[], keys: string[]) {
  if (rows.length === 0) return 0;
  const columns = getTableColumns(table);
  const set: Record<string, unknown> = {};
  for (const [prop, col] of Object.entries(columns)) {
    if (keys.includes(prop) || prop === 'createdAt' || prop === 'updatedAt') continue;
    set[prop] = sql.raw(`values(\`${col.name}\`)`);
  }
  await db.insert(table).values(rows as any).onDuplicateKeyUpdate({ set: set as any });
  return rows.length;
}

async function main() {
  const counts: Record<string, number> = {};

  counts.exam_categories = await upsert(
    schema.examCategories,
    EXAM_CATEGORIES_DATA.map((c, i) => ({
      id: c.id,
      name: c.name,
      description: c.desc,
      resourcesCount: c.resourcesCount,
      iconName: c.iconName,
      badge: c.badge ?? null,
      sortOrder: i,
    })),
    ['id']
  );

  counts.materials = await upsert(
    schema.materials,
    STUDY_MATERIALS_DATA.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      subtitle: m.subtitle ?? null,
      description: m.description,
      exam: m.exam,
      subject: m.subject,
      language: m.language,
      materialType: m.materialType,
      coverImage: m.coverImage,
      samplePages: m.samplePages,
      pages: m.pages,
      originalPrice: m.originalPrice,
      discountedPrice: m.discountedPrice,
      rating: m.rating.toFixed(1),
      reviewsCount: m.reviewsCount,
      lastUpdatedLabel: m.lastUpdated,
      featured: !!m.featured,
      bestseller: !!m.bestseller,
      isFree: !!m.isFree,
      fileSize: m.fileSize,
      tableOfContents: m.tableOfContents,
      whatIsIncluded: m.whatIsIncluded,
      tags: m.tags,
    })),
    ['id']
  );

  counts.pyqs = await upsert(
    schema.pyqs,
    PYQS_DATA.map((p) => ({
      id: p.id,
      exam: p.exam,
      year: p.year,
      subject: p.subject,
      topic: p.topic,
      source: p.source ?? null,
      questionNumber: p.questionNumber ?? null,
      question: p.question,
      options: p.options,
      correctOption: p.correctOption,
      explanation: p.explanation,
      difficulty: p.difficulty,
      isPublished: true,
      sortOrder: 0,
    })),
    ['id']
  );

  counts.quiz_sets = await upsert(
    schema.quizSets,
    QUIZ_SETS_DATA.map((q) => ({
      id: q.id,
      slug: q.id.replace(/^quiz-/, ''),
      title: q.title,
      description: q.description,
      // Normalise to the admin option lists (lib/adminOptions.ts)
      exam: q.exam.startsWith('MPSC') ? 'MPSC' : q.exam,
      subject: SEED_SUBJECT_MAP[q.subject] ?? q.subject,
      durationMinutes: q.durationMinutes,
      totalMarks: String(q.totalMarks),
      negativeMarking: q.negativeMarking,
      negativeRatio: q.negativeRatio,
      badge: q.badge ?? null,
    })),
    ['id']
  );

  counts.quiz_questions = await upsert(
    schema.quizQuestions,
    QUIZ_SETS_DATA.flatMap((set) =>
      set.questions.map((q, position) => ({
        id: q.id,
        quizSetId: set.id,
        position,
        category: q.category,
        subject: q.subject,
        exam: q.exam,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: String(q.marks),
        negativeMarks: String(q.negativeMarks),
        difficulty: q.difficulty,
      }))
    ),
    ['id']
  );

  counts.exam_updates = await upsert(
    schema.examUpdates,
    EXAM_UPDATES_DATA.map((u) => ({
      id: u.id,
      slug: u.slug,
      title: u.title,
      exam: u.exam,
      category: u.category,
      badge: u.badge,
      publishedLabel: u.publishedDate,
      lastDateLabel: u.lastDate ?? null,
      examDateLabel: u.examDate ?? null,
      shortSummary: u.shortSummary,
      fullContent: u.fullContent,
      officialLink: u.officialLink,
      syllabusLink: u.syllabusLink ?? null,
    })),
    ['id']
  );

  counts.important_dates = await upsert(
    schema.importantDates,
    IMPORTANT_DATES_DATA.map((d) => ({
      id: d.id,
      exam: d.exam,
      event: d.event,
      startDateLabel: d.startDate,
      lastDateLabel: d.lastDate,
      status: d.status,
      category: d.category,
    })),
    ['id']
  );

  counts.blog_posts = await upsert(
    schema.blogPosts,
    BLOG_POSTS_DATA.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      category: b.category,
      authorName: b.author.name,
      authorRole: b.author.role,
      authorAvatar: b.author.avatar,
      publishedLabel: b.publishedDate,
      readingTime: b.readingTime,
      coverImage: b.coverImage,
      tableOfContents: b.tableOfContents,
    })),
    ['id']
  );

  // Coupons currently hardcoded in lib/store.tsx (10% off)
  counts.coupons = await upsert(
    schema.coupons,
    ['CHAI10', 'MPSC2026', 'REVISION'].map((code) => ({ code, discountPercent: 10 })),
    ['code']
  );

  console.table(counts);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
