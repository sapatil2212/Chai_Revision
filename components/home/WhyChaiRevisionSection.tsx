'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Coffee, ShieldCheck, Zap, BookMarked, Smartphone, Users } from 'lucide-react';

export function WhyChaiRevisionSection() {
  const { lang, t } = useApp();

  const reasons = [
    {
      icon: Coffee,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'चहाच्या एका ब्रेक मध्ये रिव्हिजन',
      desc: 'मोठ्या आणि कंटाळवाण्या पुस्तकांऐवजी अत्यंत सुटसुटीत, परीक्षा-केंद्रित मायक्रो नोट्स. १० मिनिटांत संपूर्ण घटकाची उजळणी.',
    },
    {
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'आयोगाच्या पॅटर्नशी १००% सुसंगत',
      desc: 'MPSC (राज्यसेवा व संयुक्त) आणि TCS/IBPS सरळसेवा परीक्षांच्या मागील १० वर्षांच्या प्रश्नपत्रिकांचा सखोल अभ्यास करून तयार केलेले अचूक मुद्दे.',
    },
    {
      icon: Zap,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'झटपट डिजिटल पीडीएफ डाऊनलोड',
      desc: 'कोणतीही वाट न पाहता पेमेंट पूर्ण होताच क्षणात सुरक्षित डिजिटल प्रवेश. मोबाईल, लॅपटॉपवर कधीही कुठेही अभ्यास करा.',
    },
    {
      icon: Smartphone,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'सर्चबल व हायलाईट फ्रेंडली नोट्स',
      desc: 'सर्व डिजिटल फाइल्स हाय-क्वालिटी फॉन्टमध्ये आहेत, ज्यामुळे कीवर्ड शोधणे आणि स्वतःच्या नोट्स काढणे सहज शक्य होते.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase bg-blue-50/80 border border-blue-200/70 px-3 py-0.5 rounded-full inline-block">
            विश्वास व गुणवत्ता
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mt-2">
            {t.sections.whyUsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal">
            {t.sections.whyUsSub}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 text-left shadow-2xs hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 shadow-2xs ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-800 mb-2 leading-snug">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {r.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
