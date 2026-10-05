import {
  mysqlTable,
  varchar,
  int,
  text,
  json,
  boolean,
  decimal,
  timestamp,
  datetime,
  mysqlEnum,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import type { OptionId } from '@/lib/quizTypes';

// -------------------------------------------------------------------------
// Shared column helpers
// -------------------------------------------------------------------------

/** Localized text stored as JSON: { mr, en, hi } (hi optional for quiz content) */
export type LocalizedText = { mr: string; en: string; hi?: string };
export type LocalizedList = { mr: string[]; en: string[]; hi?: string[] };

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
};

const difficulty = (name: string) => mysqlEnum(name, ['Easy', 'Medium', 'Hard']);

// -------------------------------------------------------------------------
// Catalog
// -------------------------------------------------------------------------

export const examCategories = mysqlTable('exam_categories', {
  id: varchar('id', { length: 64 }).primaryKey(), // e.g. 'MPSC', 'Talathi'
  name: json('name').$type<LocalizedText>().notNull(),
  description: json('description').$type<LocalizedText>().notNull(),
  resourcesCount: int('resources_count').default(0).notNull(),
  iconName: varchar('icon_name', { length: 64 }).notNull(),
  badge: varchar('badge', { length: 32 }),
  sortOrder: int('sort_order').default(0).notNull(),
  ...timestamps,
});

export const materials = mysqlTable(
  'materials',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    slug: varchar('slug', { length: 191 }).notNull(),
    title: json('title').$type<LocalizedText>().notNull(),
    subtitle: json('subtitle').$type<LocalizedText>(),
    description: json('description').$type<LocalizedText>().notNull(),
    exam: varchar('exam', { length: 64 }).notNull(),
    subject: varchar('subject', { length: 64 }).notNull(),
    language: mysqlEnum('language', ['Marathi', 'English', 'Bilingual', 'Hindi']).notNull(),
    materialType: varchar('material_type', { length: 64 }).notNull(),
    coverImage: varchar('cover_image', { length: 512 }).notNull(),
    samplePages: json('sample_pages').$type<string[]>().notNull(),
    pages: int('pages').notNull(),
    originalPrice: int('original_price').notNull(), // whole rupees
    discountedPrice: int('discounted_price').notNull(), // whole rupees
    rating: decimal('rating', { precision: 2, scale: 1 }).default('0.0').notNull(),
    reviewsCount: int('reviews_count').default(0).notNull(),
    lastUpdatedLabel: varchar('last_updated_label', { length: 64 }), // display string, e.g. '15 Sep 2026'
    featured: boolean('featured').default(false).notNull(),
    bestseller: boolean('bestseller').default(false).notNull(),
    isFree: boolean('is_free').default(false).notNull(),
    fileSize: varchar('file_size', { length: 32 }),
    fileUrl: varchar('file_url', { length: 512 }), // private storage path for the purchasable PDF
    fileName: varchar('file_name', { length: 255 }), // original PDF file name (used for downloads)
    tableOfContents: json('table_of_contents').$type<string[]>().notNull(),
    whatIsIncluded: json('what_is_included').$type<string[]>().notNull(),
    tags: json('tags').$type<string[]>().notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    sortOrder: int('sort_order').default(0).notNull(), // lower = shown first
    downloadCount: int('download_count').default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('materials_slug_uq').on(t.slug),
    index('materials_exam_idx').on(t.exam),
    index('materials_subject_idx').on(t.subject),
    index('materials_sort_idx').on(t.sortOrder),
  ]
);

export const pyqs = mysqlTable(
  'pyqs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    exam: varchar('exam', { length: 64 }).notNull(),
    year: int('year').notNull(),
    subject: varchar('subject', { length: 64 }).notNull(),
    topic: varchar('topic', { length: 191 }).notNull(),
    /** Paper this question came from, e.g. "MPSC Rajyaseva Prelims 2024 Paper 1". */
    source: varchar('source', { length: 191 }),
    /** Question number in the original paper; orders questions within a paper. */
    questionNumber: int('question_number'),
    question: json('question').$type<LocalizedText>().notNull(),
    // Option ids are A-D, matching quiz questions so forms/CSV/AI are shared
    options: json('options').$type<{ id: OptionId; text: LocalizedText }[]>().notNull(),
    correctOption: varchar('correct_option', { length: 1 }).$type<OptionId>().notNull(),
    explanation: json('explanation').$type<LocalizedText>().notNull(),
    difficulty: difficulty('difficulty').notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    sortOrder: int('sort_order').default(0).notNull(), // lower = shown first
    ...timestamps,
  },
  (t) => [
    index('pyqs_exam_year_idx').on(t.exam, t.year),
    index('pyqs_subject_idx').on(t.subject),
    index('pyqs_published_idx').on(t.isPublished, t.year),
  ]
);

export const quizSets = mysqlTable(
  'quiz_sets',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    slug: varchar('slug', { length: 191 }).notNull(),
    title: json('title').$type<LocalizedText>().notNull(),
    description: json('description').$type<LocalizedText>().notNull(),
    instructions: json('instructions').$type<LocalizedText>(), // shown before the test starts
    exam: varchar('exam', { length: 64 }).notNull(),
    subject: varchar('subject', { length: 64 }).notNull(),
    difficulty: mysqlEnum('difficulty', ['Easy', 'Medium', 'Hard', 'Mixed']).default('Mixed').notNull(),
    durationMinutes: int('duration_minutes').notNull(),
    totalMarks: decimal('total_marks', { precision: 6, scale: 2 }).notNull(), // kept in sync with questions
    passPercentage: int('pass_percentage').default(40).notNull(),
    defaultMarks: decimal('default_marks', { precision: 5, scale: 2 }).default('2').notNull(),
    defaultNegativeMarks: decimal('default_negative_marks', { precision: 5, scale: 2 }).default('0.5').notNull(),
    negativeMarking: boolean('negative_marking').default(false).notNull(),
    negativeRatio: varchar('negative_ratio', { length: 64 }),
    badge: varchar('badge', { length: 64 }),
    shuffleQuestions: boolean('shuffle_questions').default(false).notNull(),
    shuffleOptions: boolean('shuffle_options').default(false).notNull(),
    showSolutions: boolean('show_solutions').default(true).notNull(), // answers + explanations after submit
    maxAttempts: int('max_attempts').default(0).notNull(), // per participant; 0 = unlimited
    startsAt: datetime('starts_at'), // null = available immediately
    endsAt: datetime('ends_at'), // null = never closes
    isFeatured: boolean('is_featured').default(false).notNull(),
    sortOrder: int('sort_order').default(0).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('quiz_sets_slug_uq').on(t.slug), index('quiz_sets_sort_idx').on(t.sortOrder)]
);

export const quizQuestions = mysqlTable(
  'quiz_questions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quizSetId: varchar('quiz_set_id', { length: 64 })
      .notNull()
      .references(() => quizSets.id, { onDelete: 'cascade' }),
    position: int('position').notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    subject: varchar('subject', { length: 64 }).notNull(),
    exam: varchar('exam', { length: 64 }).notNull(),
    question: json('question').$type<LocalizedText>().notNull(),
    options: json('options').$type<{ id: 'A' | 'B' | 'C' | 'D'; text: LocalizedText }[]>().notNull(),
    correctOption: mysqlEnum('correct_option', ['A', 'B', 'C', 'D']).notNull(),
    explanation: json('explanation').$type<LocalizedText>().notNull(),
    marks: decimal('marks', { precision: 5, scale: 2 }).notNull(),
    negativeMarks: decimal('negative_marks', { precision: 5, scale: 2 }).default('0').notNull(),
    difficulty: difficulty('difficulty').notNull(),
    image: varchar('image', { length: 512 }), // optional diagram/map shown with the question
  },
  (t) => [index('quiz_questions_set_idx').on(t.quizSetId, t.position)]
);

// -------------------------------------------------------------------------
// Content
// -------------------------------------------------------------------------

export const examUpdates = mysqlTable(
  'exam_updates',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    slug: varchar('slug', { length: 191 }).notNull(),
    title: json('title').$type<LocalizedText>().notNull(),
    exam: varchar('exam', { length: 64 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    badge: mysqlEnum('badge', ['NEW', 'IMPORTANT', 'LAST DATE', 'ADMIT CARD', 'RESULT']).notNull(),
    publishedLabel: varchar('published_label', { length: 64 }).notNull(),
    lastDateLabel: varchar('last_date_label', { length: 64 }),
    examDateLabel: varchar('exam_date_label', { length: 128 }),
    shortSummary: json('short_summary').$type<LocalizedText>().notNull(),
    fullContent: json('full_content').$type<LocalizedText>().notNull(),
    officialLink: varchar('official_link', { length: 512 }).notNull(),
    syllabusLink: varchar('syllabus_link', { length: 512 }),
    isPublished: boolean('is_published').default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('exam_updates_slug_uq').on(t.slug), index('exam_updates_exam_idx').on(t.exam)]
);

export const importantDates = mysqlTable('important_dates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  exam: varchar('exam', { length: 64 }).notNull(),
  event: json('event').$type<LocalizedText>().notNull(),
  startDateLabel: varchar('start_date_label', { length: 64 }).notNull(),
  lastDateLabel: varchar('last_date_label', { length: 64 }).notNull(),
  status: mysqlEnum('status', ['Upcoming', 'Active', 'Closing Soon', 'Completed']).notNull(),
  category: mysqlEnum('category', ['Form', 'Admit Card', 'Exam', 'Result']).notNull(),
  ...timestamps,
});

export const blogPosts = mysqlTable(
  'blog_posts',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    slug: varchar('slug', { length: 191 }).notNull(),
    title: json('title').$type<LocalizedText>().notNull(),
    excerpt: json('excerpt').$type<LocalizedText>().notNull(),
    content: json('content').$type<LocalizedText>().notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    authorName: varchar('author_name', { length: 128 }).notNull(),
    authorRole: varchar('author_role', { length: 128 }),
    authorAvatar: varchar('author_avatar', { length: 512 }),
    publishedLabel: varchar('published_label', { length: 64 }).notNull(),
    readingTime: varchar('reading_time', { length: 64 }),
    coverImage: varchar('cover_image', { length: 512 }).notNull(),
    tableOfContents: json('table_of_contents').$type<string[]>().notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('blog_posts_slug_uq').on(t.slug)]
);

// -------------------------------------------------------------------------
// Users & commerce
// -------------------------------------------------------------------------

export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID
    name: varchar('name', { length: 191 }).notNull(),
    email: varchar('email', { length: 191 }).notNull(),
    mobile: varchar('mobile', { length: 20 }),
    passwordHash: varchar('password_hash', { length: 255 }), // null for OTP/social-only accounts
    role: mysqlEnum('role', ['student', 'admin', 'superadmin']).default('student').notNull(),
    preferredLanguage: mysqlEnum('preferred_language', ['mr', 'en', 'hi']).default('mr').notNull(),
    targetExams: json('target_exams').$type<string[]>().notNull(),
    avatar: varchar('avatar', { length: 512 }),
    lastLoginAt: datetime('last_login_at'),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_uq').on(t.email), index('users_mobile_idx').on(t.mobile)]
);

export const coupons = mysqlTable('coupons', {
  code: varchar('code', { length: 32 }).primaryKey(),
  discountPercent: int('discount_percent').notNull(),
  maxUses: int('max_uses'), // null = unlimited
  usedCount: int('used_count').default(0).notNull(),
  expiresAt: datetime('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const orders = mysqlTable(
  'orders',
  {
    id: varchar('id', { length: 32 }).primaryKey(), // e.g. CR-2026-89412
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    subtotal: int('subtotal').notNull(),
    discount: int('discount').default(0).notNull(),
    totalAmount: int('total_amount').notNull(),
    couponCode: varchar('coupon_code', { length: 32 }).references(() => coupons.code, { onDelete: 'set null' }),
    status: mysqlEnum('status', ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'])
      .default('Pending')
      .notNull(),
    paymentProvider: varchar('payment_provider', { length: 32 }).default('razorpay').notNull(),
    paymentOrderId: varchar('payment_order_id', { length: 64 }), // gateway order id
    paymentId: varchar('payment_id', { length: 64 }),
    paymentMethod: varchar('payment_method', { length: 64 }),
    paidAt: datetime('paid_at'),
    ...timestamps,
  },
  (t) => [index('orders_user_idx').on(t.userId), uniqueIndex('orders_payment_id_uq').on(t.paymentId)]
);

export const orderItems = mysqlTable(
  'order_items',
  {
    id: int('id').autoincrement().primaryKey(),
    orderId: varchar('order_id', { length: 32 })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    materialId: varchar('material_id', { length: 64 })
      .notNull()
      .references(() => materials.id, { onDelete: 'restrict' }),
    priceAtPurchase: int('price_at_purchase').notNull(),
    downloadToken: varchar('download_token', { length: 64 }),
    tokenExpiresAt: datetime('token_expires_at'), // null = lifetime access
  },
  (t) => [
    uniqueIndex('order_items_order_material_uq').on(t.orderId, t.materialId),
    uniqueIndex('order_items_token_uq').on(t.downloadToken),
  ]
);

export const bookmarks = mysqlTable(
  'bookmarks',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemType: mysqlEnum('item_type', ['material', 'pyq', 'blog', 'quiz']).notNull(),
    itemId: varchar('item_id', { length: 64 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemType, t.itemId] })]
);

export const notifications = mysqlTable(
  'notifications',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }), // null = broadcast
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: mysqlEnum('type', ['material', 'exam', 'system', 'discount']).notNull(),
    link: varchar('link', { length: 255 }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.isRead)]
);

export const quizAttempts = mysqlTable(
  'quiz_attempts',
  {
    id: int('id').autoincrement().primaryKey(),
    // Registered student (optional until student login exists)
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
    // Anonymous browser identity (HttpOnly cookie) + display name for leaderboards
    participantId: varchar('participant_id', { length: 64 }).notNull(),
    // Details collected from the student before each attempt (snapshot per attempt)
    participantName: varchar('participant_name', { length: 80 }).notNull(),
    participantMobile: varchar('participant_mobile', { length: 20 }),
    participantEmail: varchar('participant_email', { length: 191 }),
    participantAddress: varchar('participant_address', { length: 300 }),
    quizSetId: varchar('quiz_set_id', { length: 64 })
      .notNull()
      .references(() => quizSets.id, { onDelete: 'cascade' }),
    status: mysqlEnum('status', ['in_progress', 'submitted']).default('in_progress').notNull(),
    questionOrder: json('question_order').$type<string[]>().notNull(), // question ids as served
    answers: json('answers').$type<Record<string, 'A' | 'B' | 'C' | 'D' | null>>().notNull(),
    score: decimal('score', { precision: 7, scale: 2 }).default('0').notNull(),
    totalMarks: decimal('total_marks', { precision: 7, scale: 2 }).default('0').notNull(),
    percentage: decimal('percentage', { precision: 5, scale: 2 }).default('0').notNull(),
    correctCount: int('correct_count').default(0).notNull(),
    wrongCount: int('wrong_count').default(0).notNull(),
    skippedCount: int('skipped_count').default(0).notNull(),
    passed: boolean('passed').default(false).notNull(),
    isLate: boolean('is_late').default(false).notNull(), // submitted after time + grace; excluded from leaderboard
    timeTakenSeconds: int('time_taken_seconds').default(0).notNull(),
    startedAt: datetime('started_at').notNull(),
    completedAt: datetime('completed_at'),
  },
  (t) => [
    index('quiz_attempts_user_idx').on(t.userId),
    index('quiz_attempts_set_status_idx').on(t.quizSetId, t.status),
    index('quiz_attempts_participant_idx').on(t.participantId, t.quizSetId),
    // Students directory groups attempts by mobile number
    index('quiz_attempts_mobile_idx').on(t.participantMobile),
  ]
);

// -------------------------------------------------------------------------
// Analytics — lightweight page-view tracking
// -------------------------------------------------------------------------

export const pageViews = mysqlTable(
  'page_views',
  {
    id: int('id').autoincrement().primaryKey(),
    /** SHA-256 of IP + User-Agent; never stores raw IP addresses. */
    visitorHash: varchar('visitor_hash', { length: 64 }).notNull(),
    path: varchar('path', { length: 512 }).notNull(),
    referrer: varchar('referrer', { length: 512 }),
    /** 'desktop' | 'tablet' | 'mobile' */
    deviceType: varchar('device_type', { length: 16 }),
    browser: varchar('browser', { length: 64 }),
    os: varchar('os', { length: 64 }),
    /** ISO 3166-1 alpha-2, derived from Cloudflare / Vercel headers when available. */
    country: varchar('country', { length: 4 }),
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  },
  (t) => [
    index('pv_date_idx').on(t.viewedAt),
    index('pv_visitor_idx').on(t.visitorHash),
    index('pv_path_idx').on(t.path),
  ]
);

// -------------------------------------------------------------------------
// Relations (for relational queries via db.query.*)
// -------------------------------------------------------------------------

export const quizSetsRelations = relations(quizSets, ({ many }) => ({
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quizSet: one(quizSets, { fields: [quizQuestions.quizSetId], references: [quizSets.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  quizAttempts: many(quizAttempts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  coupon: one(coupons, { fields: [orders.couponCode], references: [coupons.code] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  material: one(materials, { fields: [orderItems.materialId], references: [materials.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quizSet: one(quizSets, { fields: [quizAttempts.quizSetId], references: [quizSets.id] }),
}));
