'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import {
  BookOpen,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

export function HeroSection() {
  const { lang, navigateTo } = useApp();

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-r from-[#FDF2F8]/95 via-[#FAF5FF]/90 to-[#F3E8FF]/85 pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-6 sm:pb-8 border-b border-purple-100/70"
    >
      {/* Background Soft Glows & Subtle Grid */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-200/25 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/4 right-10 w-[460px] h-[460px] bg-purple-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none -z-0"
        style={{
          backgroundImage: 'radial-gradient(#D946EF 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-end">
          
          {/* LEFT COLUMN: Eyebrow, Heading, Crisp Subtitle, Search, Primary Actions */}
          <div className="lg:col-span-6 text-left space-y-4 sm:space-y-5 pb-4 sm:pb-6 lg:pb-8">
            
            {/* Clean Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xs border border-purple-200/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
                WELCOME TO CHAI REVISION • महाराष्ट्र स्पर्धा परीक्षा मंच
              </span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#1E2653] tracking-tight leading-[1.36] sm:leading-[1.4] lg:leading-[1.44]">
                <span className="block mb-1.5 sm:mb-2">स्पर्धा परीक्षेच्या अचूक तयारीसाठी तुमचा</span>
                <span className="text-blue-700 block">Smart Study Companion</span>
              </h1>
            </div>

            {/* Crisp 1-Line Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
              MPSC (राज्यसेवा, गट ब व क), पोलीस भरती, तलाठी आणि महाराष्ट्र शासनाच्या सर्व स्पर्धा परीक्षांसाठी १००% दर्जेदार डिजिटल नोट्स व PYQ विश्लेषण.
            </p>

            {/* Primary Action Button */}
            <div className="flex items-center pt-1">
              <button
                onClick={() => navigateTo('materials')}
                className="px-5 py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Materials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Students Image Touching the Faint Gray Line Below (Enlarged) */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-end self-end">
            <div className="w-full max-w-xl lg:max-w-2xl relative translate-y-[1px]">
              <img
                src="/images/hero_students_group.png"
                alt="MPSC and Competitive Exam Aspirants"
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>

        </div>

        {/* Faint Gray Line Touched by Image Bottom */}
        <div className="border-t border-slate-200/90" />

        {/* Animated Scroll Down Indicator */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={() => {
              const el = document.getElementById('exam-categories');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="खाली स्क्रोल करा"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
              {lang === 'mr' ? 'खाली स्क्रोल करा' : 'Scroll to explore'}
            </span>
            <div className="w-7 h-7 rounded-full border border-slate-200/80 group-hover:border-blue-300 bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-2xs group-hover:bg-blue-50/60 transition-all animate-scroll-bounce">
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}
