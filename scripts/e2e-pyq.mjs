// End-to-end check of the PYQ (previous year questions) bank against a running server.
// Usage: node --env-file=.env scripts/e2e-pyq.mjs [baseUrl]
const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3100';
const ORIGIN = { Origin: BASE };
let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) failures++;
};

const BYPASS = process.env.ADMIN_SESSION_SECRET ? { 'x-e2e-bypass': process.env.ADMIN_SESSION_SECRET } : {};

function client() {
  const jar = new Map();
  return async function call(path, { method = 'GET', body, form, origin = true } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(origin ? ORIGIN : {}),
        ...BYPASS,
        ...(jar.size ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
      },
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      redirect: 'manual',
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const [k, ...v] = pair.split('=');
      jar.set(k.trim(), v.join('='));
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text, headers: res.headers };
  };
}

const admin = client();
const pub = client();

// Everything this run creates carries the same paper name, so cleanup is exact
const STAMP = Date.now();
const SRC = `E2EPYQ-${STAMP} Practice Paper`;
const YEAR = 2019; // a year the seeded data does not use, so filters are unambiguous
const EXAM = 'STI';
const SUBJECT = 'Indian Economy';

// ======================= Admin auth =======================
check('PYQ admin API rejects anonymous', (await client()('/api/admin/pyqs')).status === 401);
const login = await admin('/api/admin/login', { method: 'POST', body: { email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS } });
check('admin login', login.status === 200, login.json?.error);

// ======================= Validation =======================
const mkQ = (over = {}) => ({
  exam: EXAM,
  year: YEAR,
  subject: SUBJECT,
  source: SRC,
  question: { mr: 'भारतातील नियोजन आयोगाची स्थापना कोणत्या वर्षी झाली?', en: 'In which year was the Planning Commission of India set up?', hi: 'भारत में योजना आयोग की स्थापना किस वर्ष हुई?' },
  options: [
    { id: 'A', text: { mr: '१९४८', en: '1948', hi: '1948' } },
    { id: 'B', text: { mr: '१९५०', en: '1950', hi: '1950' } },
    { id: 'C', text: { mr: '१९५१', en: '1951', hi: '1951' } },
    { id: 'D', text: { mr: '१९५२', en: '1952', hi: '1952' } },
  ],
  correctOption: 'B',
  explanation: { mr: 'नियोजन आयोगाची स्थापना १५ मार्च १९५० रोजी झाली.', en: 'The Planning Commission was set up on 15 March 1950.', hi: 'योजना आयोग की स्थापना 15 मार्च 1950 को हुई।' },
  difficulty: 'Medium',
  ...over,
});
const create = (body) => admin('/api/admin/pyqs', { method: 'POST', body });

check('empty body rejected', (await create({})).status === 400);
check('unknown exam rejected', (await create(mkQ({ exam: 'Nope' }))).status === 400);
check('unknown subject rejected', (await create(mkQ({ subject: 'Astrology' }))).status === 400);
check('year before 1990 rejected', (await create(mkQ({ year: 1800 }))).status === 400);
check('year far in the future rejected', (await create(mkQ({ year: new Date().getFullYear() + 5 }))).status === 400);
check('missing question text rejected', (await create(mkQ({ question: { mr: '', en: '', hi: '' } }))).status === 400);
const threeOpts = mkQ();
threeOpts.options = threeOpts.options.slice(0, 3);
check('fewer than four options rejected', (await create(threeOpts)).status === 400);
check('blank option text rejected', (await create(mkQ({ options: mkQ().options.map((o, i) => (i === 2 ? { ...o, text: { mr: '', en: '', hi: '' } } : o)) }))).status === 400);
check('invalid correctOption rejected', (await create(mkQ({ correctOption: 'E' }))).status === 400);
check('nothing was created by rejected requests', (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}`)).json.total === 0);

// ======================= Create / read / update =======================
const created = await create(mkQ({ questionNumber: 7, topic: '' }));
const q1 = created.json?.item;
check('question created', created.status === 201 && !!q1?.id, created.json?.error);
check('topic defaults to the subject when blank', q1.topic === SUBJECT, q1?.topic);
check('paper details stored', q1.exam === EXAM && q1.year === YEAR && q1.source === SRC && q1.questionNumber === 7);
check('published by default', q1.isPublished === true);
check('Devanagari round-trips in all three languages', q1.question.mr.includes('नियोजन आयोगाची') && q1.question.hi.includes('योजना आयोग') && q1.question.en.startsWith('In which year'));
check('options kept in A-D order with the answer', q1.options.map((o) => o.id).join('') === 'ABCD' && q1.correctOption === 'B');
check('timestamps returned', !!q1.createdAt && !!q1.updatedAt);

const fetched = await admin(`/api/admin/pyqs/${q1.id}`);
check('read one question', fetched.status === 200 && fetched.json.item.id === q1.id);
check('unknown id 404', (await admin('/api/admin/pyqs/pyq-does-not-exist')).status === 404);

const patched = await admin(`/api/admin/pyqs/${q1.id}`, { method: 'PATCH', body: { topic: 'Planning & Five Year Plans', difficulty: 'Hard' } });
check('partial update keeps every other field', patched.json?.item?.topic === 'Planning & Five Year Plans' && patched.json.item.difficulty === 'Hard' && patched.json.item.correctOption === 'B' && patched.json.item.question.mr === q1.question.mr, patched.json?.error);
check('invalid patch rejected', (await admin(`/api/admin/pyqs/${q1.id}`, { method: 'PATCH', body: { year: 1700 } })).status === 400);

const dup = await admin(`/api/admin/pyqs/${q1.id}/duplicate`, { method: 'POST' });
check('duplicate created as a draft', dup.status === 201 && dup.json.item.isPublished === false && dup.json.item.id !== q1.id);
const dupId = dup.json.item.id;

// ======================= Public API =======================
const byPaper = `/api/pyqs?source=${encodeURIComponent(SRC)}`;
let list = await pub(byPaper, { origin: false });
check('published question is public', list.status === 200 && list.json.total === 1 && list.json.items[0].id === q1.id, `total=${list.json?.total}`);
check('draft duplicate stays hidden', !list.json.items.some((p) => p.id === dupId));
check('public payload includes the answer and explanation (open practice)', list.json.items[0].correctOption === 'B' && !!list.json.items[0].explanation.mr);
check('public payload has no admin-only fields', list.json.items[0].isPublished === undefined && list.json.items[0].sortOrder === undefined);

check('filter by exam', (await pub(`${byPaper}&exam=${EXAM}`, { origin: false })).json.total === 1);
check('filter by wrong exam returns nothing', (await pub(`${byPaper}&exam=MPSC`, { origin: false })).json.total === 0);
check('filter by year', (await pub(`${byPaper}&year=${YEAR}`, { origin: false })).json.total === 1);
check('filter by wrong year returns nothing', (await pub(`${byPaper}&year=2001`, { origin: false })).json.total === 0);
check('filter by subject', (await pub(`${byPaper}&subject=${encodeURIComponent(SUBJECT)}`, { origin: false })).json.total === 1);
check('search matches Marathi text', (await pub(`/api/pyqs?search=${encodeURIComponent('नियोजन आयोगाची')}`, { origin: false })).json.items.some((p) => p.id === q1.id));
check('search matches English text', (await pub(`/api/pyqs?search=${encodeURIComponent('Planning Commission of India')}`, { origin: false })).json.items.some((p) => p.id === q1.id));
check('search matches the paper name', (await pub(`/api/pyqs?search=E2EPYQ-${STAMP}`, { origin: false })).json.total === 1);
check('search with no match returns nothing', (await pub('/api/pyqs?search=zzzz-no-such-question', { origin: false })).json.total === 0);

const filters = await pub('/api/pyqs/filters', { origin: false });
check('filter options list real values', filters.status === 200 && filters.json.exams.includes(EXAM) && filters.json.years.includes(YEAR) && filters.json.subjects.includes(SUBJECT), JSON.stringify(filters.json?.years));
check('filter options expose the seeded papers too', filters.json.exams.includes('MPSC') && filters.json.total >= 5);

// Unpublish and confirm it disappears from the public API
await admin(`/api/admin/pyqs/${q1.id}`, { method: 'PATCH', body: { isPublished: false } });
check('unpublished question disappears from the public API', (await pub(byPaper, { origin: false })).json.total === 0);
check('unpublished question still visible to the admin', (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}`)).json.total === 2);
await admin(`/api/admin/pyqs/${q1.id}`, { method: 'PATCH', body: { isPublished: true } });

// ======================= CSV template / import / export =======================
const template = await admin('/api/admin/pyqs/template');
check('CSV template downloads', template.status === 200 && template.headers.get('content-type')?.includes('text/csv'));
check('CSV template has the documented columns', template.text.startsWith('exam,year,subject,topic,source,question_number,question_mr'));

const HEADER = 'exam,year,subject,topic,source,question_number,question_mr,question_en,question_hi,option_a_mr,option_a_en,option_a_hi,option_b_mr,option_b_en,option_b_hi,option_c_mr,option_c_en,option_c_hi,option_d_mr,option_d_en,option_d_hi,correct_option,explanation_mr,explanation_en,explanation_hi,difficulty';
// Row 1 exercises commas + newlines inside quoted Marathi and a numeric answer (1-4)
const csvRow = (n, correct, exam = EXAM, year = YEAR) =>
  `${exam},${year},${SUBJECT},"चलनवाढ, दर","${SRC}",${n},"CSV प्रश्न ${n}, स्वल्पविरामासह","CSV question ${n}","CSV प्रश्न ${n}","अ","A","अ","ब","B","ब","क","C","क","ड","D","ड",${correct},"ओळ १\nओळ २","Line 1","पंक्ति 1",easy`;

const badCsv = await admin('/api/admin/pyqs/import', { method: 'POST', body: { csv: [HEADER, csvRow(1, 'A'), csvRow(2, 'Z')].join('\n') } });
check('CSV with a bad row is rejected with the row number', badCsv.status === 400 && badCsv.json?.errors?.[0]?.row === 3, JSON.stringify(badCsv.json?.errors));
check('nothing imported from the rejected CSV', (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}`)).json.total === 2);

const missingCol = await admin('/api/admin/pyqs/import', { method: 'POST', body: { csv: 'question_mr,correct_option\nx,A' } });
check('CSV missing required columns rejected', missingCol.status === 400 && /Missing column/i.test(missingCol.json?.error || ''), missingCol.json?.error);
check('empty CSV rejected', (await admin('/api/admin/pyqs/import', { method: 'POST', body: { csv: '' } })).status === 400);

const goodCsv = await admin('/api/admin/pyqs/import', { method: 'POST', body: { csv: [HEADER, csvRow(1, 'A'), csvRow(2, '4'), csvRow(3, 'c')].join('\n') } });
check('CSV import inserted 3 rows', goodCsv.status === 200 && goodCsv.json.inserted === 3, goodCsv.json?.error);

const adminList = await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}&limit=100`);
check('admin list now has 5 questions for this paper', adminList.json.total === 5, String(adminList.json?.total));
const csv1 = adminList.json.items.find((p) => p.question.en === 'CSV question 1');
check('CSV Marathi with a comma survived', csv1?.question.mr.includes('स्वल्पविरामासह'), csv1?.question.mr);
check('CSV multiline explanation survived', csv1?.explanation.mr === 'ओळ १\nओळ २');
check('CSV lowercase difficulty normalised to Easy', csv1?.difficulty === 'Easy', csv1?.difficulty);
check('CSV numeric answer "4" mapped to D', adminList.json.items.find((p) => p.question.en === 'CSV question 2')?.correctOption === 'D');
check('CSV lowercase answer "c" mapped to C', adminList.json.items.find((p) => p.question.en === 'CSV question 3')?.correctOption === 'C');
check('CSV rows are published and carry the paper name', adminList.json.items.every((p) => p.source === SRC));

const exported = await admin(`/api/admin/pyqs?format=csv&source=${encodeURIComponent(SRC)}`);
const exportedLines = exported.text.trim().split(/\r?\n/);
check('CSV export returns a file', exported.status === 200 && exported.headers.get('content-type')?.includes('text/csv'));
check('CSV export has a header and every row', exportedLines[0].startsWith('exam,year,subject') && exported.text.includes('CSV question 2') && exported.text.includes(SRC));

// ======================= Admin stats & paging =======================
const stats = adminList.json.stats;
check('stats count questions and years', stats.total >= 5 && stats.years >= 2 && stats.byYear.some((y) => y.year === YEAR), JSON.stringify(stats?.byYear?.slice(0, 3)));
check('stats separate drafts from published', stats.drafts >= 1 && stats.published >= 1);
const paged = await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}&limit=2`);
check('admin pagination works', paged.json.items.length === 2 && paged.json.total === 5 && paged.json.limit === 2);
const paged2 = await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}&limit=2&offset=4`);
check('admin pagination offset works', paged2.json.items.length === 1);

// ======================= Bulk insert (the AI review step) =======================
const bulkBad = await admin('/api/admin/pyqs/bulk', { method: 'POST', body: { questions: [mkQ(), mkQ({ correctOption: 'Z' })] } });
check('bulk insert validates every question', bulkBad.status === 400 && /Question 2/.test(bulkBad.json?.error || ''), bulkBad.json?.error);
check('bulk insert is all-or-nothing', (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}`)).json.total === 5);
check('bulk insert with no questions rejected', (await admin('/api/admin/pyqs/bulk', { method: 'POST', body: { questions: [] } })).status === 400);
const bulkOk = await admin('/api/admin/pyqs/bulk', { method: 'POST', body: { questions: [mkQ({ questionNumber: 20 }), mkQ({ questionNumber: 21 })] } });
check('bulk insert saved both questions', bulkOk.status === 201 && bulkOk.json.inserted === 2, bulkOk.json?.error);

// ======================= Bulk publish / unpublish / delete =======================
let all = (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}&limit=100`)).json;
check('paper now has 7 questions', all.total === 7, String(all.total));
const allIds = all.items.map((p) => p.id);

check('bulk action needs ids', (await admin('/api/admin/pyqs/actions', { method: 'POST', body: { ids: [], action: 'publish' } })).status === 400);
check('unknown bulk action rejected', (await admin('/api/admin/pyqs/actions', { method: 'POST', body: { ids: allIds, action: 'burn' } })).status === 400);

const unpub = await admin('/api/admin/pyqs/actions', { method: 'POST', body: { ids: allIds, action: 'unpublish' } });
check('bulk unpublish affected every question', unpub.json?.affected === 7, String(unpub.json?.affected));
check('bulk unpublish hides them all from students', (await pub(byPaper, { origin: false })).json.total === 0);
const rePub = await admin('/api/admin/pyqs/actions', { method: 'POST', body: { ids: allIds, action: 'publish' } });
check('bulk publish brings them back', rePub.json?.affected === 7 && (await pub(byPaper, { origin: false })).json.total === 7);

// Public paging over the full set
const p1 = await pub(`${byPaper}&limit=3`, { origin: false });
check('public pagination returns a page plus the total', p1.json.items.length === 3 && p1.json.total === 7 && p1.json.limit === 3);
const p2 = await pub(`${byPaper}&limit=3&offset=3`, { origin: false });
check('public pagination offset returns different questions', p2.json.items.length === 3 && !p2.json.items.some((x) => p1.json.items.some((y) => y.id === x.id)));
check('public limit is capped at 100', (await pub(`${byPaper}&limit=9999`, { origin: false })).json.limit === 100);

// ======================= AI import from a real-looking paper =======================
if (process.env.GEMINI_API_KEY) {
  const paper = [
    'STI Preliminary Examination 2017',
    'Maharashtra Public Service Commission — Paper I (Indian Economy)',
    '',
    'Q.1 Which institution publishes the Economic Survey of India?',
    '(A) Reserve Bank of India',
    '(B) Ministry of Finance',
    '(C) NITI Aayog',
    '(D) Central Statistics Office',
    '',
    'Q.2 The Goods and Services Tax (GST) came into effect in India on which date?',
    '(A) 1 April 2016',
    '(B) 1 July 2017',
    '(C) 15 August 2017',
    '(D) 1 January 2018',
    '',
    'Q.3 Which committee recommended the introduction of the Minimum Support Price mechanism?',
    '(A) Narasimham Committee',
    '(B) L. K. Jha Committee',
    '(C) Kelkar Committee',
    '(D) Rangarajan Committee',
    '',
    'ANSWER KEY',
    '1 - B',
    '2 - B',
    '3 - B',
  ].join('\n');

  console.log('…asking Gemini to read the question paper (this can take a while)');
  const started = Date.now();
  const form = new FormData();
  form.append('file', new File([paper], 'sti-2017-economy.txt', { type: 'text/plain' }));
  form.append('limit', '10');
  form.append('source', SRC); // keep the run's paper name so cleanup still works
  const ai = await admin('/api/admin/pyqs/ai-extract', { method: 'POST', form });
  console.log(`   (took ${Math.round((Date.now() - started) / 1000)}s)`);

  check('AI extraction succeeded', ai.status === 200 && Array.isArray(ai.json?.questions), ai.json?.error);
  if (ai.status === 200) {
    const qs = ai.json.questions;
    check('all three questions transcribed', qs.length === 3, `${qs.length} (found ${ai.json.meta.found}, skipped ${ai.json.meta.skipped})`);
    check('year read from the paper header', ai.json.paper?.year === 2017, String(ai.json.paper?.year));
    check('exam read from the paper header', ai.json.paper?.exam === 'STI', ai.json.paper?.exam);
    check('subject detected as Indian Economy', ai.json.paper?.subject === 'Indian Economy', ai.json.paper?.subject);
    check('admin paper name override respected', qs.every((q) => q.source === SRC));
    check('every question has four A-D options', qs.every((q) => q.options.length === 4 && q.options.map((o) => o.id).join('') === 'ABCD'));
    check('answer key followed for all three', qs.every((q) => q.correctOption === 'B'), qs.map((q) => q.correctOption).join(','));
    check('questions are bilingual', qs.every((q) => q.question.mr && q.question.en));
    check('Devanagari used for the Marathi text', qs.some((q) => /[\u0900-\u097F]/.test(q.question.mr)), qs[0]?.question.mr?.slice(0, 40));
    check('question numbers kept from the paper', qs.map((q) => q.questionNumber).join(',') === '1,2,3', qs.map((q) => q.questionNumber).join(','));
    check('question numbers stripped from the text', qs.every((q) => !/^Q\.?\s*\d/i.test(q.question.en)), qs[0]?.question.en?.slice(0, 30));
    check('explanations present', qs.every((q) => q.explanation.mr || q.explanation.en));

    const savedAi = await admin('/api/admin/pyqs/bulk', { method: 'POST', body: { questions: qs } });
    check('AI questions save through the normal validator', savedAi.status === 201 && savedAi.json.inserted === qs.length, savedAi.json?.error);
    const aiPublic = await pub(`${byPaper}&year=2017`, { origin: false });
    check('AI questions are immediately practisable', aiPublic.json.total === qs.length && aiPublic.json.items.every((p) => p.exam === 'STI'));
  }

  check('AI extract rejects a missing file', (await admin('/api/admin/pyqs/ai-extract', { method: 'POST', form: new FormData() })).status === 400);
  const junk = new FormData();
  junk.append('file', new File(['too short'], 'tiny.txt', { type: 'text/plain' }));
  check('AI extract rejects an unreadable file', (await admin('/api/admin/pyqs/ai-extract', { method: 'POST', form: junk })).status === 400);
  check('AI extract requires admin', (await client()('/api/admin/pyqs/ai-extract', { method: 'POST', form: new FormData() })).status === 401);
} else {
  console.log('SKIP  AI paper import (GEMINI_API_KEY not set)');
}

// ======================= Cleanup =======================
all = (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}&limit=100`)).json;
const del = await admin('/api/admin/pyqs/actions', { method: 'POST', body: { ids: all.items.map((p) => p.id), action: 'delete' } });
check('bulk delete removed every question of this run', del.json?.affected === all.total, `${del.json?.affected}/${all.total}`);
check('paper is gone from the admin', (await admin(`/api/admin/pyqs?source=${encodeURIComponent(SRC)}`)).json.total === 0);
check('paper is gone from the public API', (await pub(byPaper, { origin: false })).json.total === 0);
check('deleted question returns 404', (await admin(`/api/admin/pyqs/${q1.id}`)).status === 404);
check('seeded questions untouched', (await pub('/api/pyqs?limit=100', { origin: false })).json.total === 4, String((await pub('/api/pyqs?limit=100', { origin: false })).json.total));

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
