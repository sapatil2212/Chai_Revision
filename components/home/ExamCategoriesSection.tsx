'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { EXAM_CATEGORIES_DATA } from '@/lib/data';
import {
  GraduationCap,
  Shield,
  Coins,
  Building2,
  FileSpreadsheet,
  Award,
  BookOpen,
  Sparkles,
  Layers,
  TreePine,
  ArrowRight,
} from 'lucide-react';
import { ExamCategory } from '@/lib/types';

export function ExamCategoriesSection() {
  const { lang, t, navigateTo } = useApp();

  const getCategoryTheme = (id: ExamCategory) => {
    switch (id) {
      case 'MPSC':
        return {
          iconBg: 'bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          hoverBorder: 'hover:border-blue-300 hover:shadow-blue-500/10',
          glow: 'from-blue-500/5 to-indigo-500/5',
        };
      case 'PSI':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-500 group-hover:text-white',
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          hoverBorder: 'hover:border-amber-300 hover:shadow-amber-500/10',
          glow: 'from-amber-500/5 to-orange-500/5',
        };
      case 'STI':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          hoverBorder: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
          glow: 'from-emerald-500/5 to-teal-500/5',
        };
      case 'ASO':
        return {
          iconBg: 'bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-600 group-hover:text-white',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          hoverBorder: 'hover:border-purple-300 hover:shadow-purple-500/10',
          glow: 'from-purple-500/5 to-violet-500/5',
        };
      case 'Talathi':
        return {
          iconBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 group-hover:bg-cyan-600 group-hover:text-white',
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          hoverBorder: 'hover:border-cyan-300 hover:shadow-cyan-500/10',
          glow: 'from-cyan-500/5 to-sky-500/5',
        };
      case 'Police Bharti':
        return {
          iconBg: 'bg-orange-50 text-orange-700 border-orange-200 group-hover:bg-orange-500 group-hover:text-white',
          badge: 'bg-orange-100 text-orange-900 border-orange-200',
          hoverBorder: 'hover:border-orange-300 hover:shadow-orange-500/10',
          glow: 'from-orange-500/5 to-amber-500/5',
        };
      case 'UPSC':
        return {
          iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          hoverBorder: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
          glow: 'from-indigo-500/5 to-blue-500/5',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-blue-600 group-hover:text-white',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          hoverBorder: 'hover:border-blue-300 hover:shadow-blue-500/10',
          glow: 'from-slate-500/5 to-blue-500/5',
        };
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      case 'Coins':
        return <Coins className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'TreePine':
        return <TreePine className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const handleCategoryClick = (category: ExamCategory) => {
    navigateTo('materials', { exam: category });
  };

  return (
    <section id="exam-categories" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white via-slate-50/30 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 text-left">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-block mb-2">
              लक्ष्यित परीक्षा निवड
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t.sections.examCategories}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal max-w-2xl leading-relaxed">
              {t.sections.examCategoriesSub}
            </p>
          </div>

          <button
            onClick={() => navigateTo('materials')}
            className="h-9 px-4 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5 transition-all self-start md:self-end shrink-0 cursor-pointer shadow-2xs"
          >
            <span>सर्व परीक्षा साहित्य पाहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 10 Exam Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {EXAM_CATEGORIES_DATA.map((exam) => {
            const theme = getCategoryTheme(exam.id);
            return (
              <div
                key={exam.id}
                onClick={() => handleCategoryClick(exam.id)}
                className={`bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(15,23,42,0.05)] relative overflow-hidden`}
              >
                {/* Subtle soft gradient background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                <div className="relative z-10 text-left">
                  {/* Header with Icon & Optional Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 shadow-2xs ${theme.iconBg}`}
                    >
                      {getIcon(exam.iconName)}
                    </div>
                    {exam.badge && (
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${theme.badge}`}
                      >
                        {exam.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                    {exam.name[lang]}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {exam.desc[lang]}
                  </p>
                </div>

                {/* Footer Count & Arrow */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] relative z-10">
                  <span className="text-slate-500 group-hover:text-slate-700 font-normal">
                    {exam.resourcesCount}+ साधने
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
