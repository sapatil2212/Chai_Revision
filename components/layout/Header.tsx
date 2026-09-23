'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  Globe,
  Check,
} from 'lucide-react';
import { Language } from '@/lib/types';

interface LanguageOption {
  code: Language;
  native: string;
  label: string;
  subtitle: string;
  badge?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'mr', native: 'मराठी', label: 'Marathi', subtitle: 'महाराष्ट्र परीक्षांसाठी प्राधान्य', badge: 'Default' },
  { code: 'en', native: 'English', label: 'English', subtitle: 'Bilingual & UPSC Material' },
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
  } = useApp();

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

  const navItems: { id: string; label: string; free?: boolean }[] = [
    { id: 'materials', label: t.nav.materials },
    { id: 'courses', label: t.nav.courses },
    { id: 'pyq', label: t.nav.pyq },
    { id: 'current-affairs', label: t.nav.currentAffairs },
    { id: 'free-resources', label: t.nav.freeResources, free: true },
    { id: 'exam-updates', label: t.nav.examUpdates },
  ];

  const handleNavClick = (view: string, params?: Record<string, string>) => {
    navigateTo(view, params);
    setMobileMenuOpen(false);
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-17">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Ashoka Stambha / Government seal emblem badge */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-6 h-7 text-[#1C2C5B] shrink-0 opacity-90">
                <svg viewBox="0 0 100 125" fill="currentColor" className="w-full h-full drop-shadow-2xs">
                  <circle cx="50" cy="50" r="46" fill="#1C2C5B" fillOpacity="0.08" stroke="#1C2C5B" strokeWidth="3" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke="#1C2C5B" strokeWidth="2.5" />
                  <circle cx="50" cy="50" r="3" fill="#1C2C5B" />
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <line
                      key={idx}
                      x1="50"
                      y1="50"
                      x2={50 + 13 * Math.cos((idx * Math.PI) / 4)}
                      y2={50 + 13 * Math.sin((idx * Math.PI) / 4)}
                      stroke="#1C2C5B"
                      strokeWidth="2"
                    />
                  ))}
                  <path d="M36 28 L50 16 L64 28 L58 35 L42 35 Z" fill="#1C2C5B" />
                  <rect x="25" y="74" width="50" height="6" rx="2" fill="#1C2C5B" />
                </svg>
              </div>
              <div className="h-6 w-px bg-slate-200/80" />
            </div>

            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center text-left focus:outline-hidden cursor-pointer"
              title="Chai Revision Home"
            >
              <ChaiLogo variant="dark" size="sm" showTagline={false} />
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative h-9 px-3.5 text-xs font-medium transition-all rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-blue-700 font-bold bg-blue-50/90 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.free && (
                    <span className="text-[9px] bg-emerald-100/90 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                      Free
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities: Search, Language & Mobile Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-9 px-3 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/90 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-2"
              title="Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium text-slate-600">शोधा...</span>
              <span className="hidden md:inline text-[10px] bg-slate-50 border border-slate-200 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                ⌘K
              </span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer shadow-2xs inline-flex items-center gap-1.5 ${
                  langDropdownOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
                }`}
                title="भाषा बदला"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-[11px]">{currentLangObj.native}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 text-left">
                  <div className="px-2.5 py-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      भाषा निवडा (Select Language)
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">३ भाषा उपलब्ध</span>
                  </div>
                  <div className="mt-1.5 max-h-52 overflow-y-auto interactive-scrollbar pr-1 space-y-1">
                    {LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          setLang(item.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                          lang === item.code
                            ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200/80'
                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs">{item.native}</span>
                            <span className="text-[10px] text-slate-400">({item.label})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 font-normal">
                            {item.subtitle}
                          </p>
                        </div>
                        {lang === item.code && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/70"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                  activeView === item.id
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.free && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    FREE
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">भाषा निवडा:</span>
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    lang === l.code
                      ? 'bg-[#1C2C5B] text-white font-bold shadow-2xs'
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
