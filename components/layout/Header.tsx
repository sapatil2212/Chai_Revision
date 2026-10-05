'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import {
  Search,
  Menu,
  X,
  Globe,
  Check,
} from 'lucide-react';
import { Language } from '@/lib/types';
import { quizStatus } from '@/lib/quizTypes';

interface LanguageOption {
  code: Language;
  native: string;
  label: string;
  subtitle: string;
  badge?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'mr', native: 'मराठी', label: 'Marathi', subtitle: 'महाराष्ट्र परीक्षांसाठी प्राधान्य', badge: 'Default' },
  { code: 'en', native: 'English', label: 'English', subtitle: 'Bilingual & MPSC Material' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi', subtitle: 'राष्ट्रीय व राज्यस्तरीय परीक्षा' },
];

export function Header() {
  const {
    lang,
    setLang,
    t,
    activeView,
    navigateTo,
    setIsSearchOpen,
    quizzes,
  } = useApp();

  // "Live" badge only when at least one published test is open right now
  const hasLiveQuiz = quizzes.some((q) => quizStatus(q) === 'live');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: string; label: string; free?: boolean; badge?: string }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'materials', label: t.nav.materials },
    { id: 'quiz', label: lang === 'en' ? 'MCQ Quiz' : 'MCQ सराव / Quiz', badge: hasLiveQuiz ? 'Live' : undefined },
    { id: 'pyq', label: t.nav.pyq },
    { id: 'free-resources', label: t.nav.freeResources, free: true },
    { id: 'exam-updates', label: t.nav.examUpdates },
  ];

  const handleNavClick = (view: string, params?: Record<string, string>) => {
    navigateTo(view, params);
    setMobileMenuOpen(false);
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center text-left focus:outline-hidden cursor-pointer"
              title="Chai Revision Home"
            >
              <ChaiLogo size="sm" />
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative h-8.5 px-3 text-xs transition-all rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-slate-900 font-medium bg-slate-100 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.free && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.2 rounded-full font-medium uppercase tracking-wider">
                      Free
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200/80 px-1.5 py-0.2 rounded-full font-medium uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities: Search, Cart, Lang, Account & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-8.5 w-8.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
              title="Search (⌘K)"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className={`h-8.5 px-2.5 rounded-xl transition-all border cursor-pointer shadow-2xs inline-flex items-center gap-1 text-xs font-medium ${
                  langDropdownOpen
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                }`}
                title={`भाषा बदला (${currentLangObj.native})`}
                aria-label={`Change language (current: ${currentLangObj.label})`}
                aria-expanded={langDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-[11px] font-medium">{currentLangObj.native}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 text-left">
                  <div className="px-2.5 py-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      भाषा निवडा (Select Language)
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium">३ भाषा</span>
                  </div>
                  <div className="mt-1 max-h-52 overflow-y-auto interactive-scrollbar pr-1 space-y-1">
                    {LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          setLang(item.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                          lang === item.code
                            ? 'bg-slate-100 text-slate-900 font-medium border border-slate-200/80'
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent font-normal'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs text-slate-900">{item.native}</span>
                            <span className="text-[10px] text-slate-400">({item.label})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate font-normal">
                            {item.subtitle}
                          </p>
                        </div>
                        {lang === item.code && <Check className="w-3.5 h-3.5 text-slate-700 shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8.5 w-8.5 inline-flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-slate-200/80"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-t border-slate-200 px-4 py-3 shadow-lg space-y-3 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                  activeView === item.id
                    ? 'bg-slate-100 text-slate-900 font-medium border border-slate-200/80'
                    : 'text-slate-600 hover:bg-slate-50 font-normal'
                }`}
              >
                <span>{item.label}</span>
                {item.free && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium border border-emerald-200/70">
                    FREE
                  </span>
                )}
                {item.badge && (
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">भाषा निवडा:</span>
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    lang === l.code
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
