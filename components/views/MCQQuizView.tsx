'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApp } from '@/lib/store';
import { quizStatus, type AttemptResult, type AttemptSession, type QuizSummary } from '@/lib/quizTypes';
import { QuizApiError, quizApi, quizStorage, type ActiveAttempt, type MyAttempt, type StudentDetails } from '@/lib/quizClient';
import { QuizLobby } from '@/components/quiz/QuizLobby';
import { QuizInstructions } from '@/components/quiz/QuizInstructions';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { QuizResultView } from '@/components/quiz/QuizResultView';

type Screen = 'lobby' | 'instructions' | 'test' | 'result';

const scrollTop = () => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' });

/**
 * MCQ test engine (public). Quizzes come from the database via AppProvider;
 * questions are fetched per attempt and scored on the server.
 */
export function MCQQuizView() {
  const { lang, quizzes, viewParams, navigateTo } = useApp();
  const en = lang === 'en';

  const [screen, setScreen] = useState<Screen>('lobby');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [resume, setResume] = useState<ActiveAttempt | null>(null);
  const [history, setHistory] = useState<MyAttempt[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Deep link: #quiz/<slug> opens that quiz's instruction screen
  const deepLinked = !deepLinkDone && screen === 'lobby' && viewParams.slug ? quizzes.find((q) => q.slug === viewParams.slug) : undefined;
  const activeScreen: Screen = deepLinked ? 'instructions' : screen;
  const selected: QuizSummary | undefined = deepLinked ?? quizzes.find((q) => q.slug === selectedSlug);

  const refreshHistory = useCallback(() => {
    quizApi
      .mine()
      .then((r) => setHistory(r.items))
      .catch(() => {});
  }, []);

  // On mount: detect an unfinished attempt on this device + load personal history
  useEffect(() => {
    let alive = true;
    const active = quizStorage.getActive();
    if (active) {
      quizApi
        .get(active.attemptId, active.token)
        .then((r) => {
          if (!alive) return;
          if (r.session) setResume(active);
          else quizStorage.clearActive(); // already submitted / timed out
        })
        .catch((err) => {
          if (err instanceof QuizApiError && (err.status === 401 || err.status === 404)) quizStorage.clearActive();
        });
    }
    quizApi
      .mine()
      .then((r) => alive && setHistory(r.items))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ---------------- transitions ----------------
  const goLobby = () => {
    setDeepLinkDone(true);
    setScreen('lobby');
    setStartError('');
    if (viewParams.slug) navigateTo('quiz');
    scrollTop();
  };

  const openQuiz = (quiz: QuizSummary) => {
    setDeepLinkDone(true);
    setSelectedSlug(quiz.slug);
    setStartError('');
    setScreen('instructions');
    scrollTop();
  };

  const enterTest = (s: AttemptSession) => {
    quizStorage.setActive({ attemptId: s.attemptId, token: s.token, slug: s.quiz.slug, title: s.quiz.title });
    setResume(null);
    setSession(s);
    setSelectedSlug(s.quiz.slug);
    setDeepLinkDone(true);
    setScreen('test');
    scrollTop();
  };

  const startQuiz = async (details: StudentDetails) => {
    if (!selected) return;
    setStarting(true);
    setStartError('');
    try {
      enterTest(await quizApi.start(selected.slug, details));
    } catch (err) {
      setStartError((err as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const showResult = (r: AttemptResult) => {
    setResult(r);
    setSession(null);
    setSelectedSlug(r.quizSlug);
    setDeepLinkDone(true);
    setScreen('result');
    refreshHistory();
    scrollTop();
  };

  const resumeAttempt = async () => {
    if (!resume) return;
    setLoadingMsg(en ? 'Restoring your test…' : 'तुमची टेस्ट पुन्हा उघडत आहे…');
    try {
      const r = await quizApi.get(resume.attemptId, resume.token);
      if (r.session) enterTest(r.session);
      else if (r.result) {
        quizStorage.clearActive();
        setResume(null);
        showResult(r.result);
      }
    } catch (err) {
      quizStorage.clearActive();
      setResume(null);
      setStartError((err as Error).message);
    } finally {
      setLoadingMsg('');
    }
  };

  const openPastResult = async (a: MyAttempt) => {
    setLoadingMsg(en ? 'Loading result…' : 'निकाल उघडत आहे…');
    try {
      const r = await quizApi.get(a.attemptId, a.token);
      if (r.result) showResult(r.result);
    } catch {
      /* attempt may have been reset by admin */
      refreshHistory();
    } finally {
      setLoadingMsg('');
    }
  };

  const exitTest = () => {
    if (!confirm(en ? 'Leave the test? The timer keeps running — you can resume from the test list.' : 'टेस्ट सोडायची? वेळ चालू राहील — यादीतून पुन्हा सुरू करता येईल.')) return;
    setResume(quizStorage.getActive());
    setSession(null);
    setScreen('lobby');
    scrollTop();
  };

  const resultQuiz = result ? quizzes.find((q) => q.slug === result.quizSlug) ?? null : null;
  const canRetake = !!resultQuiz && quizStatus(resultQuiz) === 'live';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-['Poppins',sans-serif]">
      <div className="max-w-6xl mx-auto">
        {loadingMsg && (
          <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-xs flex items-center justify-center" role="status" aria-live="polite">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> {loadingMsg}
            </p>
          </div>
        )}

        {activeScreen === 'lobby' && (
          <QuizLobby
            quizzes={quizzes}
            lang={lang}
            resume={resume}
            history={history}
            onOpen={openQuiz}
            onResume={resumeAttempt}
            onDiscardResume={() => setResume(null)}
            onOpenResult={openPastResult}
          />
        )}

        {activeScreen === 'instructions' && selected && (
          <QuizInstructions quiz={selected} lang={lang} starting={starting} error={startError} onBack={goLobby} onStart={startQuiz} />
        )}

        {activeScreen === 'instructions' && !selected && (
          <div className="text-center py-20 space-y-3">
            <p className="text-sm font-semibold text-slate-700">{en ? 'This test is no longer available.' : 'ही टेस्ट सध्या उपलब्ध नाही.'}</p>
            <button onClick={goLobby} className="px-5 py-2.5 bg-[#1C2C5B] text-white rounded-xl text-xs font-bold cursor-pointer">
              {en ? 'See all tests' : 'सर्व टेस्ट्स पाहा'}
            </button>
          </div>
        )}

        {activeScreen === 'test' && session && <QuizRunner key={session.attemptId} session={session} lang={lang} onSubmitted={showResult} onExit={exitTest} />}

        {activeScreen === 'result' && result && (
          <QuizResultView
            result={result}
            quiz={resultQuiz}
            lang={lang}
            onRetake={canRetake ? () => resultQuiz && openQuiz(resultQuiz) : null}
            onBack={goLobby}
            onMaterials={() => navigateTo('materials')}
          />
        )}
      </div>
    </div>
  );
}
