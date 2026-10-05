// End-to-end check of the MCQ quiz LMS against a running server.
// Usage: node --env-file=.env scripts/e2e-quiz.mjs [baseUrl]
const BASE = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3100';
const ORIGIN = { Origin: BASE };
let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) failures++;
};

/** Minimal cookie jar per "browser". */
const BYPASS = process.env.ADMIN_SESSION_SECRET ? { 'x-e2e-bypass': process.env.ADMIN_SESSION_SECRET } : {};

function client() {
  const jar = new Map();
  return async function call(path, { method = 'GET', body, origin = true } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(origin ? ORIGIN : {}),
        ...BYPASS,
        ...(jar.size ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
    return { status: res.status, json, text, headers: res.headers, jar };
  };
}

const admin = client();
const student1 = client();
const student2 = client();
const marker = `E2EQ${Date.now()}`;

// Students must now identify themselves before every attempt. Mobiles are unique per
// run (and share a prefix) so the superadmin directory can be queried for this run only.
const MOB = String(Date.now()).slice(-8);
const mob = (n) => `9${MOB}${n}`;
const ADDRESS = 'शिरूर, ता. शिरूर, जि. पुणे';
const who = (name, n, extra = {}) => ({ name, mobile: mob(n), address: ADDRESS, ...extra });

// ======================= Admin auth =======================
check('admin quiz API rejects anonymous', (await client()('/api/admin/quizzes')).status === 401);
const login = await admin('/api/admin/login', { method: 'POST', body: { email: process.env.ADMIN_USER, password: process.env.ADMIN_PASS } });
check('admin login', login.status === 200);

// ======================= Create quiz =======================
const base = {
  title: { mr: `${marker} राज्यघटना सराव`, en: `${marker} Polity Practice` },
  description: { mr: 'चाचणी', en: 'Test quiz' },
  exam: 'MPSC', subject: 'Polity & Constitution', difficulty: 'Medium',
  durationMinutes: 10, passPercentage: 50, defaultMarks: 2, defaultNegativeMarks: 0.5,
};
check('unknown exam rejected', (await admin('/api/admin/quizzes', { method: 'POST', body: { ...base, exam: 'Nope' } })).status === 400);
check('end before start rejected', (await admin('/api/admin/quizzes', { method: 'POST', body: { ...base, startsAt: '2030-01-02T00:00:00Z', endsAt: '2030-01-01T00:00:00Z' } })).status === 400);
check('reserved slug rejected', (await admin('/api/admin/quizzes', { method: 'POST', body: { ...base, slug: 'me' } })).status === 400);
const created = await admin('/api/admin/quizzes', { method: 'POST', body: { ...base, isPublished: true } });
const quiz = created.json?.item;
check('quiz created as draft', created.status === 201 && quiz?.isPublished === false, created.json?.error);
const Q = `/api/admin/quizzes/${quiz.id}`;
check('cannot publish without questions', (await admin(Q, { method: 'PATCH', body: { isPublished: true } })).status === 400);

// ======================= Questions =======================
const mkQ = (n, correct = 'B') => ({
  question: { mr: `${marker} प्रश्न ${n}`, en: `${marker} Question ${n}` },
  options: ['A', 'B', 'C', 'D'].map((id) => ({ id, text: { mr: `पर्याय ${id}${n}`, en: `Option ${id}${n}` } })),
  correctOption: correct,
  explanation: { mr: `स्पष्टीकरण ${n}`, en: `Explanation ${n}` },
  topic: 'Articles',
});
check('question missing an option rejected', (await admin(`${Q}/questions`, { method: 'POST', body: { ...mkQ(0), options: mkQ(0).options.slice(0, 3) } })).status === 400);
const q1 = (await admin(`${Q}/questions`, { method: 'POST', body: mkQ(1, 'B') })).json?.item;
const q2 = (await admin(`${Q}/questions`, { method: 'POST', body: { ...mkQ(2, 'C'), marks: 4, negativeMarks: 1 } })).json?.item;
check('questions added with defaults/overrides', q1?.marks === 2 && q1?.negativeMarks === 0.5 && q2?.marks === 4 && q2?.negativeMarks === 1);

// CSV: invalid row → nothing imported
const header = 'question_mr,question_en,option_a_mr,option_a_en,option_b_mr,option_b_en,option_c_mr,option_c_en,option_d_mr,option_d_en,correct_option,explanation_mr,explanation_en,marks,negative_marks,difficulty,topic';
const row = (n, correct) =>
  `"${marker} CSV प्रश्न ${n}, स्वल्पविरामासह","CSV question ${n}","अ","A","ब","B","क","C","ड","D",${correct},"ओळ १\nओळ २","Line 1",,,"easy","CSV"`;
const bad = await admin(`${Q}/import`, { method: 'POST', body: { csv: [header, row(1, 'A'), row(2, 'Z')].join('\n'), mode: 'append' } });
check('CSV with bad row rejected with row number', bad.status === 400 && bad.json?.errors?.[0]?.row === 3, JSON.stringify(bad.json?.errors));
const good = await admin(`${Q}/import`, { method: 'POST', body: { csv: [header, row(1, 'A'), row(2, '4'), row(3, 'b')].join('\n'), mode: 'append' } });
check('CSV import inserted 3 (quotes, commas, newlines, 1-4 answers)', good.json?.inserted === 3, good.json?.error);

let detail = (await admin(Q)).json;
check('quiz now has 5 questions', detail.questions.length === 5);
const csvQ = detail.questions.find((q) => q.question.en === 'CSV question 1');
check('CSV Marathi text with comma + multiline explanation preserved', csvQ?.question.mr.includes('स्वल्पविरामासह') && csvQ?.explanation.mr === 'ओळ १\nओळ २' && csvQ?.difficulty === 'Easy');
check('CSV numeric answer "4" mapped to D', detail.questions.find((q) => q.question.en === 'CSV question 2')?.correctOption === 'D');
check('totals recomputed (2+4+2+2+2 = 12)', detail.quiz.totalMarks === 12 && detail.quiz.negativeMarking === true, String(detail.quiz.totalMarks));

// Reorder, duplicate, delete
const ids = detail.questions.map((q) => q.id);
await admin(`${Q}/questions`, { method: 'PUT', body: { order: [...ids].reverse() } });
detail = (await admin(Q)).json;
check('reorder works', detail.questions[0].id === ids[ids.length - 1]);
check('reorder with missing ids rejected', (await admin(`${Q}/questions`, { method: 'PUT', body: { order: ids.slice(1) } })).status === 400);
const dupQ = await admin(`${Q}/questions/${q1.id}/duplicate`, { method: 'POST' });
check('duplicate question', dupQ.status === 201);
await admin(`${Q}/questions/${dupQ.json.item.id}`, { method: 'DELETE' });
const edited = await admin(`${Q}/questions/${q1.id}`, { method: 'PATCH', body: { explanation: { mr: 'नवीन', en: 'Updated' } } });
check('edit question keeps other fields', edited.json?.item?.explanation.en === 'Updated' && edited.json.item.correctOption === 'B');

const exported = await admin(`${Q}/export`);
check('export CSV has header + 5 rows', exported.status === 200 && exported.text.trim().split(/\r?\n/).length >= 6);

// Restore a known order and publish
await admin(`${Q}/questions`, { method: 'PUT', body: { order: ids } });
const pub = await admin(Q, { method: 'PATCH', body: { isPublished: true } });
check('publish with questions', pub.json?.item?.isPublished === true, pub.json?.error);
const slug = pub.json.item.slug;
detail = (await admin(Q)).json;
const answerKey = Object.fromEntries(detail.questions.map((q) => [q.id, q.correctOption]));
const marksOf = Object.fromEntries(detail.questions.map((q) => [q.id, q]));

// ======================= Public listing =======================
const list = await client()('/api/quizzes', { origin: false });
const pubQuiz = list.json?.items?.find((q) => q.slug === slug);
check('published quiz in public list (cache revalidated)', !!pubQuiz && pubQuiz.questionCount === 5);
check('public list has no answers', !list.text.includes('correctOption'));
const quizPage = await client()('/quiz', { origin: false });
check('quiz page renders it', quizPage.status === 200 && quizPage.text.includes(`${marker} Polity Practice`));

// ======================= Student attempt =======================
const START = `/api/quizzes/${slug}/start`;
check('start without Origin blocked', (await student1(START, { method: 'POST', body: who('Rahul', 1), origin: false })).status === 403);

// ----------- Student details are mandatory (email is the only optional field) -----------
const badStart = (body) => student1(START, { method: 'POST', body });
check('start with no details rejected', (await badStart({})).status === 400);
check('start with name only rejected', (await badStart({ name: 'Rahul Patil' })).status === 400);
check('missing mobile rejected', (await badStart({ name: 'Rahul Patil', address: ADDRESS })).status === 400);
check('short mobile rejected', (await badStart({ name: 'Rahul Patil', mobile: '12345', address: ADDRESS })).status === 400);
check('mobile not starting 6-9 rejected', (await badStart({ name: 'Rahul Patil', mobile: '5876543210', address: ADDRESS })).status === 400);
check('one-letter name rejected', (await badStart({ name: 'R', mobile: mob(1), address: ADDRESS })).status === 400);
check('missing address rejected', (await badStart({ name: 'Rahul Patil', mobile: mob(1) })).status === 400);
check('too-short address rejected', (await badStart({ name: 'Rahul Patil', mobile: mob(1), address: 'पु' })).status === 400);
check('invalid email rejected', (await badStart({ ...who('Rahul Patil', 1), email: 'not-an-email' })).status === 400);
check('no attempt created by rejected starts', (await admin(`/api/admin/quiz-students?search=${MOB}`)).json.total === 0);

const s1 = await student1(START, { method: 'POST', body: who('  Rahul <b>Patil</b> ', 1, { email: ' Rahul.Patil@Example.COM ' }) });
const sess = s1.json;
check('attempt started', s1.status === 200 && sess?.questions?.length === 5 && sess.resumed === false, s1.json?.error);
check('participant cookie set (HttpOnly)', s1.jar.has('cr_pid'));
check('session never exposes answers/explanations', !s1.text.includes('correctOption') && !s1.text.includes('Explanation'));
check('participant name sanitised', sess.participantName === 'Rahul bPatil/b' || !sess.participantName.includes('<'), sess.participantName);

const again = await student1(START, { method: 'POST', body: who('Rahul Patil', 1) });
check('re-start resumes same attempt', again.json?.attemptId === sess.attemptId && again.json.resumed === true);

const [a, b, c] = sess.questions;
const wrongOf = (id) => ['A', 'B', 'C', 'D'].find((o) => o !== answerKey[id]);
const answers = { [a.id]: answerKey[a.id], [b.id]: answerKey[b.id], [c.id]: wrongOf(c.id) };
const saved = await student1(`/api/quizzes/attempts/${sess.attemptId}/answers`, { method: 'PUT', body: { token: sess.token, answers } });
check('autosave', saved.json?.saved === 3);
const reopened = await student1(`/api/quizzes/attempts/${sess.attemptId}?token=${encodeURIComponent(sess.token)}`, { origin: false });
check('reopen returns saved answers', reopened.json?.session?.answers?.[a.id] === answerKey[a.id]);
check('wrong token rejected', (await student1(`/api/quizzes/attempts/${sess.attemptId}?token=x`, { origin: false })).status === 401);
check('other student cannot use the token for another attempt', (await student2(`/api/quizzes/attempts/${sess.attemptId + 1}/submit`, { method: 'POST', body: { token: sess.token } })).status !== 200);

const expected = marksOf[a.id].marks + marksOf[b.id].marks - marksOf[c.id].negativeMarks;
const sub = await student1(`/api/quizzes/attempts/${sess.attemptId}/submit`, { method: 'POST', body: { token: sess.token, answers } });
const r1 = sub.json;
check('server-side score correct', r1?.score === expected && r1.correct === 2 && r1.wrong === 1 && r1.skipped === 2, `${r1?.score} vs ${expected}`);
check('percentage & pass computed', r1.percentage === Math.round((expected / 12) * 10000) / 100 && r1.passed === r1.percentage >= 50);
check('review reveals answers + explanations after submit', r1.review.every((x) => x.correctOption && x.question.en) && r1.review.some((x) => x.explanation));
check('rank 1 of 1', r1.rank === 1 && r1.participants === 1);
const resub = await student1(`/api/quizzes/attempts/${sess.attemptId}/submit`, { method: 'POST', body: { token: sess.token, answers: {} } });
check('submit is idempotent', resub.json?.score === r1.score);
check('answers locked after submit', (await student1(`/api/quizzes/attempts/${sess.attemptId}/answers`, { method: 'PUT', body: { token: sess.token, answers: {} } })).status === 409);

// Second student scores full marks → rank 1
const s2 = (await student2(START, { method: 'POST', body: who('Sneha', 2) })).json;
const all = Object.fromEntries(s2.questions.map((q) => [q.id, answerKey[q.id]]));
const r2 = (await student2(`/api/quizzes/attempts/${s2.attemptId}/submit`, { method: 'POST', body: { token: s2.token, answers: all } })).json;
check('full marks = 100%', r2.score === 12 && r2.percentage === 100 && r2.rank === 1 && r2.participants === 2);

const lb = (await student1(`/api/quizzes/${slug}/leaderboard`, { origin: false })).json;
check('leaderboard ordered with isYou flag', lb.top[0].name === 'Sneha' && lb.top[1].isYou === true && lb.participants === 2);
const mine = (await student1('/api/quizzes/me', { origin: false })).json;
check('my attempts history', mine.items.some((x) => x.attemptId === sess.attemptId));

// ======================= Rules: attempts, schedule, solutions, shuffle =======================
await admin(Q, { method: 'PATCH', body: { maxAttempts: 1 } });
check('max attempts enforced', (await student1(START, { method: 'POST', body: who('Rahul Patil', 1) })).status === 403);
await admin(Q, { method: 'PATCH', body: { maxAttempts: 0, startsAt: new Date(Date.now() + 86400000).toISOString() } });
check('upcoming quiz cannot start', (await client()(START, { method: 'POST', body: who('Early Bird', 9) })).status === 409);
await admin(Q, { method: 'PATCH', body: { startsAt: '', endsAt: new Date(Date.now() - 60000).toISOString() } });
check('ended quiz cannot start', (await client()(START, { method: 'POST', body: who('Too Late', 9) })).status === 409);
await admin(Q, { method: 'PATCH', body: { endsAt: '', showSolutions: false, shuffleQuestions: true, shuffleOptions: true } });
const s3c = client();
const s3 = (await s3c(START, { method: 'POST', body: who('Hidden', 3) })).json;
check('shuffle keeps every question and A–D option', s3.questions.length === 5 && s3.questions.every((q) => q.options.map((o) => o.id).sort().join('') === 'ABCD'));
const r3 = (await s3c(`/api/quizzes/attempts/${s3.attemptId}/submit`, { method: 'POST', body: { token: s3.token, answers: {} } })).json;
check('hidden solutions: no correct answers or explanations', r3.review.every((x) => x.correctOption === null && x.explanation === null) && r3.skipped === 5 && r3.score === 0);

// ======================= Repeat student (same mobile, two attempts) =======================
// Second attempt sends the number in +91 xxxxx xxxxx form to prove normalisation groups them.
const repeat = client();
const spaced = `+91 ${mob(7).slice(0, 5)} ${mob(7).slice(5)}`;
const rp1 = (await repeat(START, { method: 'POST', body: who('Vaibhav Kadam', 7) })).json;
await repeat(`/api/quizzes/attempts/${rp1.attemptId}/submit`, { method: 'POST', body: { token: rp1.token, answers: {} } });
const rp2 = (await repeat(START, { method: 'POST', body: { name: 'Vaibhav S Kadam', mobile: spaced, address: ADDRESS } })).json;
check('second attempt allowed when unlimited', rp2.attemptId !== rp1.attemptId && rp2.resumed === false);
const rpAll = Object.fromEntries(rp2.questions.map((q) => [q.id, answerKey[q.id]]));
await repeat(`/api/quizzes/attempts/${rp2.attemptId}/submit`, { method: 'POST', body: { token: rp2.token, answers: rpAll } });

// ======================= Analytics & admin actions =======================
const an = (await admin(`${Q}/analytics`)).json;
check('analytics summary', an.summary.attempts === 5 && an.summary.participants === 4, `${an.summary.attempts}/${an.summary.participants}`);
check('per-question accuracy computed', an.perQuestion.length === 5 && an.perQuestion.some((q) => q.attempted >= 1));
check('analytics recent rows carry student contact details', an.recent.some((r) => r.mobile === mob(2) && r.address === ADDRESS), JSON.stringify(an.recent[0]));
const attCsv = await admin(`${Q}/attempts`);
check('attempts CSV includes names', attCsv.text.includes('Sneha') && attCsv.text.includes('Hidden'));
check('attempts CSV includes mobile, email and address', attCsv.text.includes('Mobile,Email,Address') && attCsv.text.includes(mob(2)) && attCsv.text.includes('rahul.patil@example.com') && attCsv.text.includes(ADDRESS));

// ======================= Superadmin students directory =======================
check('students directory rejects anonymous', (await client()('/api/admin/quiz-students')).status === 401);
const dirRes = await admin(`/api/admin/quiz-students?search=${MOB}&limit=50`);
const dir = dirRes.json;
check('directory lists one row per student of this run', dirRes.status === 200 && dir?.total === 4, `total=${dir?.total}`);
const rahul = dir.items.find((s) => s.mobile === mob(1));
const sneha = dir.items.find((s) => s.mobile === mob(2));
const vaibhav = dir.items.find((s) => s.mobile === mob(7));
check('details stored exactly as validated', rahul?.name === 'Rahul bPatil/b' && rahul?.email === 'rahul.patil@example.com' && rahul?.address === ADDRESS, JSON.stringify(rahul));
check('optional email stays empty when not given', sneha && sneha.email === null);
check('+91 and spaces normalised to the same student', !!vaibhav && vaibhav.attempts === 2 && vaibhav.tests === 1, JSON.stringify(vaibhav));
check('newest attempt supplies the displayed name', vaibhav?.name === 'Vaibhav S Kadam', vaibhav?.name);
check('best and average score aggregated', vaibhav?.bestPercentage === 100 && vaibhav?.avgPercentage === 50, `${vaibhav?.bestPercentage}/${vaibhav?.avgPercentage}`);
check('timestamps recorded', !!rahul?.firstSeenAt && !!rahul?.lastSeenAt && new Date(rahul.lastSeenAt).getTime() > 0);
check('summary counts attempts and students', dir.summary.students >= 4 && dir.summary.attempts >= 5);
check('search by name works', (await admin('/api/admin/quiz-students?search=Vaibhav%20S')).json.items.some((s) => s.mobile === mob(7)));
const byEmail = (await admin('/api/admin/quiz-students?search=rahul.patil%40example.com')).json;
check('search by email is precise', byEmail.total >= 1 && byEmail.items.every((s) => s.email === 'rahul.patil@example.com'));
check('search with no match returns nothing', (await admin('/api/admin/quiz-students?search=zzzz-no-such-student')).json.total === 0);
check('sort by attempts puts the repeat student first', (await admin(`/api/admin/quiz-students?search=${MOB}&sort=attempts`)).json.items[0].mobile === mob(7));
check('pagination works', (await admin(`/api/admin/quiz-students?search=${MOB}&limit=2`)).json.items.length === 2);

const sDetail = await admin(`/api/admin/quiz-students/${mob(7)}`);
check('student detail returns full attempt history', sDetail.status === 200 && sDetail.json.attempts.length === 2 && sDetail.json.student.mobile === mob(7));
check('attempt history has per-attempt timestamps and scores', sDetail.json.attempts.every((at) => at.startedAt && at.completedAt && at.quizTitle) && sDetail.json.attempts.some((at) => at.percentage === 100));
check('attempt history keeps the name typed for that attempt', sDetail.json.attempts[0].name === 'Vaibhav S Kadam' && sDetail.json.attempts[1].name === 'Vaibhav Kadam');
check('unknown student 404', (await admin('/api/admin/quiz-students/9000000000')).status === 404);

const sCsv = await admin(`/api/admin/quiz-students?format=csv&search=${MOB}`);
check('students CSV exports contact details', sCsv.status === 200 && sCsv.headers.get('content-type')?.includes('text/csv'));
check('students CSV has the expected columns and rows', sCsv.text.includes('Name,Mobile,Email,Address') && sCsv.text.includes(mob(7)) && sCsv.text.includes(ADDRESS) && sCsv.text.trim().split(/\r?\n/).length === 5, String(sCsv.text.trim().split(/\r?\n/).length));
const dupQuiz = (await admin(`${Q}/duplicate`, { method: 'POST' })).json?.item;
check('duplicate quiz as draft with questions', dupQuiz?.isPublished === false && dupQuiz.stats.questions === 5);
const reset = (await admin(`${Q}/attempts`, { method: 'DELETE' })).json;
check('reset attempts', reset.deleted === 5 && (await admin(`${Q}/analytics`)).json.summary.attempts === 0, String(reset.deleted));
check('reset also clears the students directory', (await admin(`/api/admin/quiz-students?search=${MOB}`)).json.total === 0);

// ======================= Late / expired attempts (back-date start time in the DB) =======================
if (process.env.DATABASE_URL) {
  const mysql = (await import('mysql2/promise')).default;
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const backdate = (id, minutes) =>
    conn.query('UPDATE quiz_attempts SET started_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? MINUTE) WHERE id = ?', [minutes, id]);

  // Late submit: past duration (10 min) + grace → scored from autosaved answers, flagged late, not ranked
  const lateC = client();
  const ls = (await lateC(START, { method: 'POST', body: who('Late', 4) })).json;
  const firstId = ls.questions[0].id;
  await lateC(`/api/quizzes/attempts/${ls.attemptId}/answers`, { method: 'PUT', body: { token: ls.token, answers: { [firstId]: answerKey[firstId] } } });
  await backdate(ls.attemptId, 20);
  const allRight = Object.fromEntries(ls.questions.map((q) => [q.id, answerKey[q.id]]));
  const lr = (await lateC(`/api/quizzes/attempts/${ls.attemptId}/submit`, { method: 'POST', body: { token: ls.token, answers: allRight } })).json;
  check('late submit flagged and unranked', lr.isLate === true && lr.rank === null);
  check('late submit ignores answers sent after time (uses autosave)', lr.correct === 1, String(lr.correct));
  check('late time capped at duration', lr.timeTakenSeconds === 600);
  const lbLate = (await client()(`/api/quizzes/${slug}/leaderboard`, { origin: false })).json;
  check('late attempt excluded from leaderboard', !lbLate.top.some((e) => e.name === 'Late'));

  // Expired + reopened: auto-submitted with saved answers
  const expC = client();
  const es = (await expC(START, { method: 'POST', body: who('Away', 5) })).json;
  await backdate(es.attemptId, 30);
  const reopen = (await expC(`/api/quizzes/attempts/${es.attemptId}?token=${encodeURIComponent(es.token)}`, { origin: false })).json;
  check('expired attempt auto-submits on reopen', !!reopen.result && !reopen.session && reopen.result.isLate === true);

  // Expired then start again: old one finalized, fresh attempt created
  const exp2 = client();
  const e1 = (await exp2(START, { method: 'POST', body: who('Gone Away', 6) })).json;
  await backdate(e1.attemptId, 30);
  const e2 = (await exp2(START, { method: 'POST', body: who('Gone Away', 6) })).json;
  check('starting after expiry gives a fresh attempt', e2.attemptId !== e1.attemptId && e2.resumed === false);

  // In-progress attempts still belong to a real, contactable student
  const inProg = (await admin(`/api/admin/quiz-students?search=${mob(6)}`)).json.items[0];
  check('unfinished attempts appear in the directory', inProg?.attempts === 2 && inProg.submitted === 1 && inProg.inProgress === 1, JSON.stringify(inProg));
  await conn.end();
} else {
  console.log('SKIP  late/expiry checks (DATABASE_URL not set)');
}

// ======================= Cleanup =======================
check('delete duplicate', (await admin(`/api/admin/quizzes/${dupQuiz.id}`, { method: 'DELETE' })).status === 200);
check('delete quiz', (await admin(Q, { method: 'DELETE' })).status === 200);
check('deleted quiz 404', (await admin(Q)).status === 404);
const after = await client()('/api/quizzes', { origin: false });
check('removed from public list', !after.json.items.some((q) => q.slug === slug));
check('leaderboard 404 after delete', (await client()(`/api/quizzes/${slug}/leaderboard`, { origin: false })).status === 404);
check('deleting the quiz removes its students from the directory', (await admin(`/api/admin/quiz-students?search=${MOB}`)).json.total === 0);

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
