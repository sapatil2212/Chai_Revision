'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  ChevronDown,
} from 'lucide-react';

export function HeroSection() {
  const { lang, t, navigateTo, setIsSearchOpen, setSearchQuery } = useApp();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setSearchQuery(heroSearch);
      setIsSearchOpen(true);
    }
  };

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
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#1E2653] tracking-tight leading-[1.18]">
                स्पर्धा परीक्षेच्या अचूक तयारीसाठी तुमचा{' '}
                <span className="text-blue-700">Smart Study Companion</span>
              </h1>
            </div>

            {/* Crisp 1-Line Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
              MPSC (राज्यसेवा, गट ब व क), पोलीस भरती, तलाठी आणि महाराष्ट्र शासनाच्या सर्व स्पर्धा परीक्षांसाठी १००% दर्जेदार डिजिटल नोट्स व PYQ विश्लेषण.
            </p>

            {/* Clean Integrated Search Bar */}
            <form onSubmit={handleHeroSearch} className="max-w-lg">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 pl-4 flex items-center gap-2 border border-slate-200/90 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={lang === 'mr' ? 'उदा. MPSC राज्यघटना, भूगोल, TCS नोट्स शोधा...' : 'Search subjects, exams, PYQs...'}
                  className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden py-1.5"
                />
                <button
                  type="submit"
                  className="bg-[#1C2C5B] hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  {lang === 'en' ? 'Search' : 'शोध घ्या'}
                </button>
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => navigateTo('materials')}
                className="px-5 py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t.exploreCTA}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigateTo('free-resources')}
                className="px-4 py-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all border border-slate-200/90 shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>मोफत सराव व PYQ</span>
              </button>
            </div>

            {/* Concise Stats Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#1E2653]">५०,०००+</span>
                <span>डाऊनलोड्स</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#1E2653]">१००%</span>
                <span>परीक्षानिहाय नोट्स</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-bold">४.९ ★</span>
                <span>विद्यार्थी रेटिंग</span>
              </div>
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
