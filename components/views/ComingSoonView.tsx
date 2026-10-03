'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Clock, ArrowLeft } from 'lucide-react';

interface ComingSoonViewProps {
  title: string;
}

export function ComingSoonView({ title }: ComingSoonViewProps) {
  const { lang, navigateTo } = useApp();

  return (
    <section className="bg-slate-50 min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Clock className="w-7 h-7 text-blue-600" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            Coming Soon
          </span>
          <h1 className="text-2xl font-extrabold text-[#1E2653]">{title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {lang === 'en'
              ? 'We are working on this section. It will be available soon.'
              : 'हा विभाग लवकरच उपलब्ध होईल. आम्ही यावर काम करत आहोत.'}
          </p>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{lang === 'en' ? 'Back to Home' : 'मुख्यपृष्ठावर जा'}</span>
        </button>
      </div>
    </section>
  );
}
