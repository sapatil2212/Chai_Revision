'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { QUIZ_SETS_DATA, QuizSet, QuizQuestion } from '@/lib/quizData';
import {
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Trophy,
  Award,
  Flag,
  Check,
  Pause,
  Play,
  Share2,
  FileText,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

export function MCQQuizView() {
  const { lang, t, navigateTo } = useApp();

  // Active Screen: 'lobby' | 'test' | 'result'
  const [screen, setScreen] = useState<'lobby' | 'test' | 'result'>('lobby');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSet>(QUIZ_SETS_DATA[0]);

  // Test Runtime States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [questionLang, setQuestionLang] = useState<'mr' | 'en'>(lang === 'en' ? 'en' : 'mr');

  // Timer States
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 mins default
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);

  // Modals & Filters
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start a chosen quiz set
  const handleStartQuiz = (quiz: QuizSet) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setSecondsRemaining(quiz.durationMinutes * 60);
    setTimeTakenSeconds(0);
    setIsTimerPaused(false);
    setScreen('test');
    setShowSubmitModal(false);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (screen !== 'test') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isTimerPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeTakenSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, isTimerPaused]);

  // Auto-submit when timer expires
  const handleAutoSubmit = () => {
    setShowSubmitModal(false);
    setScreen('result');
  };

  // Manual submit action
  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    setScreen('result');
  };

  // Option selection
  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  // Clear answer
  const handleClearAnswer = () => {
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  // Navigation within Test
  const handleNext = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Format Seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Current Question Object
  const currentQ = selectedQuiz.questions[currentQuestionIndex];
  const totalQuestions = selectedQuiz.questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unvisitedCount = totalQuestions - answeredCount;

  // Score Calculation
  const totalCorrect = selectedQuiz.questions.filter(
    (q) => userAnswers[q.id] === q.correctOption
  ).length;

  const totalIncorrect = selectedQuiz.questions.filter(
    (q) => userAnswers[q.id] && userAnswers[q.id] !== q.correctOption
  ).length;

  const totalUnattempted = selectedQuiz.questions.filter((q) => !userAnswers[q.id]).length;

  const rawMarks = totalCorrect * (selectedQuiz.totalMarks / selectedQuiz.totalQuestions);
  const negativePenalty = totalIncorrect * 0.5;
  const finalScore = Math.max(0, rawMarks - negativePenalty);
  const accuracyPercentage =
    answeredCount > 0 ? Math.round((totalCorrect / answeredCount) * 100) : 0;

  // Filtered Review Questions on Scorecard
  const filteredReviewQuestions = selectedQuiz.questions.filter((q) => {
    const userChoice = userAnswers[q.id];
    if (reviewFilter === 'correct') return userChoice === q.correctOption;
    if (reviewFilter === 'incorrect') return userChoice && userChoice !== q.correctOption;
    if (reviewFilter === 'unattempted') return !userChoice;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-['Poppins',sans-serif]">
      <div className="max-w-6xl mx-auto">
        {/* ================================================================= */}
        {/* 1. QUIZ LOBBY VIEW (CHOOSE YOUR TIMED MOCK TEST) */}
        {/* ================================================================= */}
        {screen === 'lobby' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#1C2C5B] via-[#1E293B] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-200 text-xs font-semibold backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Maharashtra Competitive Exam Timed Mock Engine</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  MCQ सराव व Live Timed Quizzes
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  परीक्षेसारख्या कडक वेळेत सराव करा. अचूक वेळ व्यवस्थापन (Time Management), निगेटिव्ह मार्किंग व त्वरित विश्लेषणासह तुमचे ज्ञान तपासा.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>१० दर्जेदार प्रश्नसंच</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Live Countdown Timer</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span>सविस्तर मराठी व English स्पष्टीकरण</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Selection Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1E2653]">
                    उपलब्ध मॉक टेस्ट्स (Choose Mock Test)
                  </h2>
                  <p className="text-xs text-slate-500">
                    खालीलपैकी तुमचा विषय निवडा आणि प्रत्यक्ष परीक्षा वेळेत सराव सुरू करा.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {QUIZ_SETS_DATA.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider font-mono">
                          {quiz.exam}
                        </span>
                        {quiz.badge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            ★ {quiz.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {quiz.title.mr}
                        </h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1">{quiz.title.en}</p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {quiz.description.mr}
                      </p>

                      {/* Quiz Meta Badges */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">वेळ (Time)</span>
                          <span className="text-xs font-bold text-slate-800 font-mono flex items-center justify-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {quiz.durationMinutes} मिनिटे
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">प्रश्न (Q)</span>
                          <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                            {quiz.totalQuestions} MCQs
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">गुण (Marks)</span>
                          <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
                            {quiz.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>निगेटिव्ह मार्किंग:</span>
                        <span className="font-mono font-semibold text-rose-600">{quiz.negativeRatio}</span>
                      </div>
                    </div>

                    <div className="pt-5">
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="w-full py-3 px-4 rounded-xl bg-[#1C2C5B] group-hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/10 cursor-pointer active:scale-98"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>टेस्ट सुरू करा (Start Quiz)</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. ACTIVE TIMED QUIZ EXAMINATION ROOM */}
        {/* ================================================================= */}
        {screen === 'test' && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Sticky Top Examination Header */}
            <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Leave Quiz"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedQuiz.title.mr}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span className="text-blue-700 font-semibold">{currentQ.subject}</span>
                    <span>•</span>
                    <span>प्रश्न {currentQuestionIndex + 1} / {totalQuestions}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Countdown Timer */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-xs transition-colors ${
                    secondsRemaining < 60
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                      : secondsRemaining < 180
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(secondsRemaining)}</span>
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  टेस्ट सबमिट करा
                </button>
              </div>
            </div>

            {/* Main Question & Palette Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Question Box (Left 8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Meta Row: Marks, Language Toggle, and Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold text-xs">
                      Q.{currentQuestionIndex + 1}
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono font-medium">
                      +{currentQ.marks}.00 Marks
                    </span>
                    <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-mono font-medium">
                      -{currentQ.negativeMarks} Neg
                    </span>
                  </div>

                  {/* Bilingual Toggle for this Question */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setQuestionLang('mr')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        questionLang === 'mr' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      मराठी
                    </button>
                    <button
                      onClick={() => setQuestionLang('en')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        questionLang === 'en' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.question[questionLang]}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((option) => {
                    const isSelected = userAnswers[currentQ.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(option.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-100 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono transition-colors ${
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {option.id}
                        </div>
                        <span
                          className={`text-xs sm:text-sm pt-0.5 leading-relaxed ${
                            isSelected ? 'font-bold text-blue-950' : 'text-slate-700 font-medium'
                          }`}
                        >
                          {option.text[questionLang]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation and Actions Bar */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleReview}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        markedForReview[currentQ.id]
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {markedForReview[currentQ.id] ? 'Marked for Review ✓' : 'Mark for Review'}
                      </span>
                    </button>

                    {userAnswers[currentQ.id] && (
                      <button
                        onClick={handleClearAnswer}
                        className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        उत्तर पुसा (Clear)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handlePrev}
                      disabled={currentQuestionIndex === 0}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>मागे (Previous)</span>
                    </button>

                    <button
                      onClick={
                        currentQuestionIndex === totalQuestions - 1
                          ? () => setShowSubmitModal(true)
                          : handleNext
                      }
                      className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>
                        {currentQuestionIndex === totalQuestions - 1
                          ? 'रिव्ह्यू व सबमिट'
                          : 'सेव्ह व पुढे (Next)'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Palette Drawer (Right 4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Question Palette (प्रश्न यादी)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {answeredCount} / {totalQuestions} सोडवले
                  </span>
                </div>

                {/* Status Color Legend */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>उत्तर दिलेले ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>रिव्ह्यू मार्क ({reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>सध्याचा प्रश्न</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span>बाकी ({unvisitedCount})</span>
                  </div>
                </div>

                {/* Question Bubbles Grid */}
                <div className="grid grid-cols-5 gap-2.5 pt-2">
                  {selectedQuiz.questions.map((q, idx) => {
                    const isAnswered = Boolean(userAnswers[q.id]);
                    const isReviewed = Boolean(markedForReview[q.id]);
                    const isCurrent = idx === currentQuestionIndex;

                    let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                    if (isAnswered && !isReviewed) {
                      bgClass = 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs';
                    } else if (isReviewed) {
                      bgClass = 'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs';
                    }

                    if (isCurrent) {
                      bgClass += ' ring-2 ring-blue-600 ring-offset-2';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-10 rounded-xl text-xs font-mono font-semibold flex items-center justify-center border transition-all cursor-pointer ${bgClass}`}
                        title={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full py-2.5 px-4 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    टेस्ट सबमिट करा (Submit Test)
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">टेस्ट सबमिट करायची आहे का?</h3>
                    <p className="text-xs text-slate-500">
                      सबमिट केल्यानंतर तुम्हाला तुमचा गुणफलक व सविस्तर स्पष्टीकरणे पाहता येतील.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">सोडवले</span>
                      <span className="text-sm font-bold text-emerald-700">{answeredCount}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">बाकी</span>
                      <span className="text-sm font-bold text-slate-600">{unvisitedCount}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">रिव्ह्यू</span>
                      <span className="text-sm font-bold text-amber-600">{reviewCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      सराव सुरू ठेवा (Cancel)
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      className="flex-1 py-2.5 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      होय, सबमिट करा
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. RESULTS & ANALYTICS SCORECARD VIEW */}
        {/* ================================================================= */}
        {screen === 'result' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Scorecard Hero Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider font-mono">
                  {selectedQuiz.exam} • निकाल व विश्लेषण (Scorecard)
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2653]">
                  {finalScore >= 14 ? 'अभिनंदन! उत्कृष्ट कामगिरी!' : 'चांगला प्रयत्न! सराव सुरू ठेवा!'}
                </h1>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {selectedQuiz.title.mr} चे अंतिम गुण व अचूक स्पष्टीकरण खाली दिले आहे.
                </p>
              </div>

              {/* 4 KPI Score Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-2">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <span className="block text-[10px] text-blue-800 font-semibold uppercase tracking-wider">
                    एकूण गुण (Score)
                  </span>
                  <span className="text-2xl font-black text-blue-900 font-mono mt-1 block">
                    {finalScore.toFixed(1)} / {selectedQuiz.totalMarks}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="block text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                    अचूकता (Accuracy)
                  </span>
                  <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                    {accuracyPercentage}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="block text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                    लागलेला वेळ (Time)
                  </span>
                  <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">
                    {formatTime(timeTakenSeconds)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="block text-[10px] text-purple-800 font-semibold uppercase tracking-wider">
                    बरोबर / चूक
                  </span>
                  <span className="text-2xl font-black text-purple-900 font-mono mt-1 block">
                    {totalCorrect} / {totalIncorrect}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  className="px-5 py-2.5 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>पुन्हा टेस्ट द्या (Retake Quiz)</span>
                </button>

                <button
                  onClick={() => setScreen('lobby')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  दुसरा विषय निवडा (Browse Other Quizzes)
                </button>

                <button
                  onClick={() => navigateTo('materials')}
                  className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>संबंधित नोट्स पाहा</span>
                </button>
              </div>
            </div>

            {/* Detailed Question Explanations Review */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1E2653]">सविस्तर विश्लेषण व स्पष्टीकरण</h3>
                  <p className="text-xs text-slate-500">
                    प्रत्येक प्रश्नाचे अचूक उत्तर व संदर्भ स्पष्टीकरण काळजीपूर्वक वाचा.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      reviewFilter === 'all' ? 'bg-[#1C2C5B] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    सर्व ({totalQuestions})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      reviewFilter === 'correct' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    बरोबर ({totalCorrect})
                  </button>
                  <button
                    onClick={() => setReviewFilter('incorrect')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      reviewFilter === 'incorrect' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    चूक ({totalIncorrect})
                  </button>
                  <button
                    onClick={() => setReviewFilter('unattempted')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      reviewFilter === 'unattempted' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    बाकी ({totalUnattempted})
                  </button>
                </div>
              </div>

              {/* Review Question Cards */}
              <div className="space-y-4">
                {filteredReviewQuestions.map((q) => {
                  const userChoice = userAnswers[q.id];
                  const isCorrect = userChoice === q.correctOption;
                  const isSkipped = !userChoice;

                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-3xl p-6 border shadow-xs space-y-4 transition-colors ${
                        isCorrect
                          ? 'border-emerald-200'
                          : isSkipped
                          ? 'border-slate-200'
                          : 'border-rose-200'
                      }`}
                    >
                      {/* Question Status Banner */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {q.id.toUpperCase()}
                          </span>
                          <span className="text-slate-500 font-semibold">{q.subject}</span>
                        </div>

                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            बरोबर (+{q.marks}.00)
                          </span>
                        ) : isSkipped ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            सोडवला नाही (0.00)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            चुकीचे उत्तर (-{q.negativeMarks})
                          </span>
                        )}
                      </div>

                      {/* Question Text in Marathi */}
                      <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                        {q.question.mr}
                      </p>
                      <p className="text-xs text-slate-500 font-sans italic">{q.question.en}</p>

                      {/* Options Review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt) => {
                          const isOptionCorrect = opt.id === q.correctOption;
                          const isOptionSelectedByUser = userChoice === opt.id;

                          let optClass = 'bg-slate-50 border-slate-200 text-slate-700';
                          if (isOptionCorrect) {
                            optClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                          } else if (isOptionSelectedByUser && !isOptionCorrect) {
                            optClass = 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${optClass}`}
                            >
                              <span className="font-mono font-bold">{opt.id}.</span>
                              <div className="min-w-0">
                                <p>{opt.text.mr}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{opt.text.en}</p>
                              </div>
                              {isOptionCorrect && (
                                <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Reference Pedagogical Explanation Box */}
                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>सविस्तर स्पष्टीकरण (Detailed Explanation):</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-normal">{q.explanation.mr}</p>
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-blue-200/50 leading-relaxed">
                          {q.explanation.en}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
