'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Home, BookOpen, HelpCircle, Bell, User } from 'lucide-react';

export function MobileNav() {
  const { activeView, navigateTo, cart, unreadNotificationsCount } = useApp();

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'materials', label: 'Materials', icon: BookOpen, badge: cart.length > 0 ? cart.length : undefined },
    { id: 'pyq', label: 'PYQs', icon: HelpCircle },
    { id: 'exam-updates', label: 'Updates', icon: Bell, hasDot: unreadNotificationsCount > 0 },
    { id: 'dashboard', label: 'Account', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] rounded-xl transition-all relative cursor-pointer ${
                isActive ? 'text-blue-600 font-bold bg-blue-50/70' : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-blue-600' : 'stroke-2 text-slate-500'}`} />
                {item.hasDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-blue-600' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
