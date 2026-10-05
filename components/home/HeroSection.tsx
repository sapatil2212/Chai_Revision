'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import {
  BookOpen,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export function HeroSection() {
  const { lang, navigateTo } = useApp();

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-slate-50/30 pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-10 sm:pb-14 border-b border-slate-200/80"
    >
      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none -z-0"
        style={{
          backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* LEFT COLUMN: Eyebrow, Heading, Crisp Subtitle, Primary Actions, Trust Badges */}
          <div className="lg:col-span-6 text-left space-y-5 pb-2 sm:pb-4">
            
            {/* Clean LMS Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-700 tracking-wide">
                महाराष्ट्र स्पर्धा परीक्षा डिजिटल मंच • २०२६
              </span>
            </div>

            {/* Main Headline - Light, Elegant, Professional Typography */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-semibold text-slate-900 tracking-tight leading-[1.3] sm:leading-[1.32] lg:leading-[1.32]">
                <span className="block text-slate-800">स्पर्धा परीक्षेच्या अचूक तयारीसाठी</span>
                <span className="text-slate-900 block font-bold">Smart Study Companion</span>
              </h1>
            </div>

            {/* Crisp Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal max-w-xl">
              MPSC (राज्यसेवा, गट ब व क), पोलीस भरती, तलाठी आणि महाराष्ट्र शासनाच्या सर्व परीक्षांसाठी १००% दर्जेदार डिजिटल नोट्स व PYQ सराव.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => navigateTo('materials')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>साहित्य पाहा (Browse Materials)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('quiz')}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-xl border border-slate-200/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>दैनिक सराव क्विझ</span>
              </button>
            </div>

            {/* Micro Trust Stats */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-md">
              <div className="text-left">
                <span className="block text-base sm:text-lg font-semibold text-slate-900">५४k+</span>
                <span className="text-[11px] text-slate-400 font-normal">नोंदणीकृत अभ्यासक</span>
              </div>
              <div className="text-left">
                <span className="block text-base sm:text-lg font-semibold text-slate-900">१००%</span>
                <span className="text-[11px] text-slate-400 font-normal">अभ्यासक्रम सुसंगत</span>
              </div>
              <div className="text-left">
                <span className="block text-base sm:text-lg font-semibold text-slate-900">४.९★</span>
                <span className="text-[11px] text-slate-400 font-normal">विद्यार्थी रेटिंग</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Student Visual Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center">
            <div className="w-full max-w-xl lg:max-w-2xl">
              <img
                src="/images/hero_students_group.png"
                alt="MPSC and Competitive Exam Aspirants"
                className="w-full h-auto object-contain block drop-shadow-sm"
              />
            </div>
          </div>

        </div>

        {/* Faint Gray Dividing Line */}
        <div className="mt-8 border-t border-slate-200/70" />

        {/* Minimal Scroll Down Indicator */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              const el = document.getElementById('exam-categories');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="खाली स्क्रोल करा"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
              {lang === 'mr' ? 'खाली स्क्रोल करा' : 'Scroll to explore'}
            </span>
            <div className="w-6 h-6 rounded-full border border-slate-200 group-hover:border-slate-300 bg-white flex items-center justify-center shadow-2xs group-hover:bg-slate-50 transition-all">
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}
