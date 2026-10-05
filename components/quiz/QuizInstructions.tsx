'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, ShieldCheck, RefreshCw, Play, AlertCircle, UserPlus } from 'lucide-react';
import { quizStatus, type LeaderboardEntry, type QuizSummary } from '@/lib/quizTypes';
import type { Language } from '@/lib/types';
import { quizApi, type StudentDetails } from '@/lib/quizClient';
import { StudentDetailsModal } from './StudentDetailsModal';
import { LeaderboardList, fmtWhen, relTime, tx } from './shared';

interface Props {
  quiz: QuizSummary;
  lang: Language;
  starting: boolean;
  error: string;
  onBack: () => void;
  onStart: (details: StudentDetails) => void;
}

const DEFAULT_RULES = {
  mr: [
    'टाइमर सुरू झाल्यावर थांबवता येणार नाही; वेळ संपताच टेस्ट आपोआप सबमिट होईल.',
    'प्रत्येक प्रश्नाला एकच योग्य उत्तर आहे. उत्तर बदलणे किंवा पुसणे केव्हाही शक्य आहे.',
    '“Mark for Review” वापरून शंका असलेले प्रश्न नंतर पुन्हा पाहा.',
    'तुमची उत्तरे आपोआप सेव्ह होतात — पेज रिफ्रेश झाले तरी टेस्ट पुढे सुरू करता येईल.',
    'कीबोर्ड: 1–4 / A–D उत्तर निवडा, ← → मागे/पुढे, M = रिव्ह्यू.',
  ],
  en: [
    'The timer cannot be paused; the test submits automatically when time runs out.',
    'Each question has exactly one correct answer. You can change or clear answers any time.',
    'Use “Mark for Review” for questions you want to revisit.',
    'Answers are saved automatically — you can resume after a page refresh.',
    'Keyboard: 1–4 / A–D to answer, ← → to navigate, M to mark for review.',
  ],
};

export function QuizInstructions({ quiz, lang, starting, error, onBack, onStart }: Props) {
  const en = lang === 'en';
  const [agreed, setAgreed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [board, setBoard] = useState<{ participants: number; top: LeaderboardEntry[]; you: LeaderboardEntry | null } | null>(null);
  const [now] = useState(() => Date.now());
  const status = quizStatus(quiz, now);

  useEffect(() => {
    let alive = true;
    quizApi
      .leaderboard(quiz.slug, 10)
      .then((b) => alive && setBoard(b))
      .catch(() => alive && setBoard({ participants: 0, top: [], you: null }));
    return () => {
      alive = false;
    };
  }, [quiz.slug]);

  const custom = tx(quiz.instructions, lang)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rules = custom.length ? custom : DEFAULT_RULES[en ? 'en' : 'mr'];

  // Details are collected in a popup so every attempt is tied to a real student
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || status !== 'live') return;
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {en ? 'All tests' : 'सर्व टेस्ट्स'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider font-mono">
              {quiz.exam} • {quiz.subject}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E2653] mt-3">{tx(quiz.title, lang)}</h1>
            {tx(quiz.description, lang) && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{tx(quiz.description, lang)}</p>}
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              [en ? 'Questions' : 'प्रश्न', quiz.questionCount],
              [en ? 'Total marks' : 'एकूण गुण', quiz.totalMarks],
              [en ? 'Duration' : 'वेळ', `${quiz.durationMinutes} ${en ? 'min' : 'मि.'}`],
              [en ? 'Pass mark' : 'उत्तीर्ण', `${quiz.passPercentage}%`],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <dt className="text-[10px] uppercase font-bold text-slate-400">{k}</dt>
                <dd className="text-base font-extrabold text-slate-900 font-mono">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className={`px-2.5 py-1 rounded-lg border font-semibold ${quiz.negativeMarking ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {en ? 'Negative marking' : 'निगेटिव्ह मार्किंग'}: {quiz.negativeMarking ? quiz.negativeLabel : en ? 'none' : 'नाही'}
            </span>
            <span className="px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 font-semibold">
              {en ? 'Attempts allowed' : 'प्रयत्न मर्यादा'}: {quiz.maxAttempts || (en ? 'unlimited' : 'अमर्याद')}
            </span>
            {quiz.endsAt && (
              <span className="px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 font-semibold">
                {en ? 'Closes' : 'शेवटची वेळ'}: {fmtWhen(quiz.endsAt)}
              </span>
            )}
          </div>

          <section aria-labelledby="rules-title">
            <h2 id="rules-title" className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
              {en ? 'Instructions' : 'महत्त्वाच्या सूचना'}
            </h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </section>

          {status === 'live' ? (
            <form onSubmit={submit} className="space-y-4 border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 shrink-0 mt-px" aria-hidden="true" />
                {en
                  ? 'You will be asked for your name, mobile number and address before the test begins.'
                  : 'टेस्ट सुरू करण्यापूर्वी तुमचे नाव, मोबाइल क्रमांक व पत्ता विचारला जाईल.'}
              </p>
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 mt-0.5" />
                {en ? 'I have read the instructions and I am ready to begin.' : 'मी सर्व सूचना वाचल्या असून टेस्ट सुरू करण्यास तयार आहे.'}
              </label>
              {error && !detailsOpen && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!agreed || starting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#1C2C5B] hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {starting ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                {en ? 'Continue to start' : 'पुढे जा व सुरू करा'}
                <span className="font-mono text-xs opacity-80 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {quiz.durationMinutes}:00
                </span>
              </button>
            </form>
          ) : (
            <div className={`rounded-2xl p-4 text-sm font-semibold ${status === 'upcoming' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`} role="status">
              {status === 'upcoming'
                ? `${en ? 'This test opens on' : 'ही टेस्ट सुरू होईल'} ${fmtWhen(quiz.startsAt!)} (${relTime(new Date(quiz.startsAt!).getTime() - now, lang)})`
                : en
                  ? 'This test has ended. See the final leaderboard.'
                  : 'ही टेस्ट संपली आहे. अंतिम गुणवत्ता यादी पाहा.'}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <LeaderboardList entries={board?.top ?? []} you={board?.you ?? null} participants={board?.participants ?? 0} lang={lang} loading={!board} />
        </div>
      </div>

      {detailsOpen && (
        <StudentDetailsModal
          quizTitle={tx(quiz.title, lang)}
          lang={lang}
          busy={starting}
          serverError={error}
          onCancel={() => setDetailsOpen(false)}
          onSubmit={onStart}
        />
      )}
    </div>
  );
}
