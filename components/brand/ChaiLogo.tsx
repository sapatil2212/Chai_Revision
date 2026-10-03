'use client';

import React from 'react';

interface ChaiLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ChaiLogo({ size = 'md' }: ChaiLogoProps) {
  const heightClass = {
    sm: 'h-10 sm:h-11',
    md: 'h-12',
    lg: 'h-16',
  }[size];

  return (
    <img
      src="/images/cr-logo.png"
      alt="Chai Revision"
      className={`${heightClass} w-auto object-contain block select-none`}
    />
  );
}
