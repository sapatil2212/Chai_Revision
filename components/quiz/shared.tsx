'use client';

import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import { quizStatus, type L2, type LeaderboardEntry, type QuizStatus, type QuizSummary, formatClock } from '@/lib/quizTypes';
import type { Language } from '@/lib/types';

/** Pick the text for the UI language (Hindi falls back to Marathi, then English). */
export const tx = (v: L2 | null | undefined, lang: Language | 'mr' | 'en') =>
  !v ? '' : lang === 'en' ? v.en || v.mr : v.mr || v.en;

export const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "2 दिवस 3 तास", "45 मिनिटे" etc. */
export function relTime(ms: number, lang: Language) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (lang === 'en') return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
  return d ? `${d} दिवस ${h} तास` : h ? `${h} तास ${m} मि.` : `${m} मिनिटे`;
}

export function StatusChip({ quiz, now, lang }: { quiz: QuizSummary; now: number; lang: Language }) {
  const s: QuizStatus = quizStatus(quiz, now);
  if (s === 'live')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        {quiz.endsAt ? 'Live' : lang === 'en' ? 'Open' : 'उपलब्ध'}
      </span>
    );
  if (s === 'upcoming')
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
        {lang === 'en' ? 'Starts in' : 'सुरू होईल'} {relTime(new Date(quiz.startsAt!).getTime() - now, lang)}
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold">
      {lang === 'en' ? 'Ended' : 'संपली'}
    </span>
  );
}

export function LeaderboardList({
  entries,
  you,
  participants,
  lang,
  loading,
}: {
  entries: LeaderboardEntry[];
  you: LeaderboardEntry | null;
  participants: number;
  lang: Language;
  loading?: boolean;
}) {
  const medal = (r: number) => (r === 1 ? 'bg-amber-400 text-white' : r === 2 ? 'bg-slate-300 text-slate-800' : r === 3 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-600');
  const row = (e: LeaderboardEntry) => (
    <li key={`${e.rank}-${e.name}`} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${e.isYou ? 'bg-blue-50 border border-blue-200' : ''}`}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${medal(e.rank)}`}>{e.rank}</span>
      <span className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">
        {e.name}
        {e.isYou && <span className="ml-1 text-[10px] text-blue-700">({lang === 'en' ? 'you' : 'तुम्ही'})</span>}
      </span>
      <span className="text-xs font-mono font-bold text-slate-900">{e.score}</span>
      <span className="text-[10px] font-mono text-slate-400 w-12 text-right flex items-center gap-0.5 justify-end">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {formatClock(e.timeTakenSeconds)}
      </span>
    </li>
  );
  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs" aria-labelledby="lb-title">
      <div className="flex items-center justify-between mb-3">
        <h3 id="lb-title" className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {lang === 'en' ? 'Leaderboard' : 'गुणवत्ता यादी (Leaderboard)'}
        </h3>
        <span className="text-[11px] text-slate-400">
          {participants} {lang === 'en' ? 'students' : 'विद्यार्थी'}
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">
          {lang === 'en' ? 'Be the first to take this test!' : 'ही टेस्ट देणारे पहिले विद्यार्थी व्हा!'}
        </p>
      ) : (
        <ol className="space-y-1">
          {entries.map(row)}
          {you && (
            <>
              <li className="text-center text-slate-300 text-xs" aria-hidden="true">⋮</li>
              {row(you)}
            </>
          )}
        </ol>
      )}
    </section>
  );
}
