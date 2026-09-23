'use client';

import React from 'react';

interface ChaiLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function ChaiLogo({ variant = 'dark', size = 'md', showTagline = true }: ChaiLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
  }[size];

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none group cursor-pointer">
      {/* Modern Dual-Tone Tea Cup Graphic Icon */}
      <div
        className={`${sizeClasses} rounded-xl flex items-center justify-center relative shrink-0 transition-all duration-300 group-hover:scale-105 shadow-sm bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 transition-transform group-hover:-rotate-3"
        >
          {/* Steam curls with subtle pulse */}
          <path d="M7 2c0 1.2.8 1.8 1.2 2.4" stroke="#FFF7ED" strokeWidth="1.8" className="opacity-90" />
          <path d="M11 1.5c0 1.5.8 2.2 1.2 2.8" stroke="#FFF7ED" strokeWidth="1.8" className="opacity-100" />
          <path d="M15 2c0 1.2.8 1.8 1.2 2.4" stroke="#FFF7ED" strokeWidth="1.8" className="opacity-80" />
          {/* Cup body */}
          <path d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" fill="#FFF7ED" fillOpacity="0.15" />
          {/* Handle */}
          <path d="M17 10h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" />
          {/* Saucer */}
          <path d="M3 21h15" />
        </svg>

        {/* Dynamic bright blue notification dot accent */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className={`${titleSizes} text-slate-900 group-hover:text-blue-900 transition-colors`}>
            CHAI <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">REVISION</span>
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium tracking-wide mt-0.5 leading-tight text-slate-500">
            चाय रिव्हिजन • Smart Study Companion
          </span>
        )}
      </div>
    </div>
  );
}
