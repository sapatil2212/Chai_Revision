'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import {
  MessageCircle,
  Youtube,
  Send,
  Instagram,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Heart,
  ChevronRight,
  ArrowUp,
  Sparkles,
} from 'lucide-react';

function FooterLink({
  onClick,
  children,
  highlight = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1 text-left cursor-pointer transition-colors duration-150 ${
        highlight
          ? 'text-emerald-700 hover:text-emerald-800 font-semibold'
          : 'text-slate-500 hover:text-blue-600'
      }`}
    >
      <ChevronRight
        className="w-3 h-3 -ml-3 opacity-0 group-hover:ml-0 group-hover:opacity-100 transition-all duration-150 text-blue-600"
        aria-hidden="true"
      />
      <span>{children}</span>
    </button>
  );
}

const SOCIALS = [
  { href: 'https://t.me', title: 'Telegram Channel', Icon: Send, hover: 'hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300' },
  { href: 'https://whatsapp.com', title: 'WhatsApp Study Group', Icon: MessageCircle, hover: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300' },
  { href: 'https://youtube.com', title: 'YouTube Video Revision', Icon: Youtube, hover: 'hover:bg-red-50 hover:text-red-600 hover:border-red-300' },
  { href: 'https://instagram.com', title: 'Instagram', Icon: Instagram, hover: 'hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300' },
];

const TRUST_ITEMS = [
  { Icon: ShieldCheck, title: '१००% सुरक्षित पेमेंट्स', sub: 'Razorpay व UPI एनक्रिप्टेड', color: 'text-blue-600 bg-blue-50 border-blue-200/80' },
  { Icon: CheckCircle2, title: 'झटपट डिजिटल प्रवेश', sub: 'पेमेंटनंतर क्षणात PDF डाऊनलोड', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80' },
  { Icon: Mail, title: 'विद्यार्थी सहाय्यता', sub: 'WhatsApp व ईमेल सपोर्ट २४x७', color: 'text-amber-600 bg-amber-50 border-amber-200/80' },
  { Icon: Heart, title: 'टॉपर्सचे पसंतीचे संकलन', sub: 'परीक्षानिहाय अचूक विश्लेषण', color: 'text-rose-600 bg-rose-50 border-rose-200/80' },
];

const EXAMS = [
  'MPSC राज्यसेवा',
  'PSI / STI / ASO संयुक्त',
  'तलाठी भरती (TCS)',
  'महाराष्ट्र पोलीस भरती',
  'जिल्हा परिषद व सरळसेवा',
  'TET / TAIT शिक्षक भरती',
];

export function Footer() {
  const { navigateTo } = useApp();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-12 bg-slate-50 border-t border-slate-200/80 text-slate-600 pt-12 pb-20 lg:pb-8">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {TRUST_ITEMS.map(({ Icon, title, sub, color }) => (
            <div
              key={title}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all text-left"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-900">{title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-normal">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Link Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10 text-left">
          {/* Brand Info */}
          <div className="col-span-2 space-y-3.5">
            <button
              onClick={() => navigateTo('home')}
              className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
              title="Chai Revision Home"
            >
              <ChaiLogo size="sm" />
            </button>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-normal">
              महाराष्ट्र स्पर्धा परीक्षेच्या अचूक तयारीसाठी तुमचा Smart Study Companion. दर्जेदार डिजिटल नोट्स, सराव पेपर्स आणि परीक्षेचे मार्गदर्शन.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {SOCIALS.map(({ href, title, Icon, hover }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={title}
                  aria-label={title}
                  className={`w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center transition-all shadow-2xs ${hover}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Materials Links */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              साहित्य व विभाग
            </h4>
            <ul className="space-y-2 text-xs">
              <li><FooterLink onClick={() => navigateTo('materials')}>Study Materials</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('quiz')}>MCQ सराव / Quiz</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('pyq')}>PYQ प्रश्नसंच</FooterLink></li>
              <li>
                <FooterLink onClick={() => navigateTo('free-resources')} highlight>
                  <span className="inline-flex items-center gap-1">
                    मोफत साहित्य (Free) <Sparkles className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                  </span>
                </FooterLink>
              </li>
              <li><FooterLink onClick={() => navigateTo('blogs')}>अभ्यास ब्लॉग्स</FooterLink></li>
            </ul>
          </div>

          {/* Exams Links */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              प्रमुख स्पर्धा परीक्षा
            </h4>
            <ul className="space-y-2 text-xs">
              {EXAMS.map((exam) => (
                <li key={exam}>
                  <FooterLink onClick={() => navigateTo('materials')}>{exam}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-xs font-medium text-slate-900 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              मदत व कायदेशीर
            </h4>
            <ul className="space-y-2 text-xs">
              <li><FooterLink onClick={() => navigateTo('exam-updates')}>परीक्षा अपडेट्स</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('important-dates')}>महत्वाच्या तारखा कॅलेंडर</FooterLink></li>
              <li>
                <a
                  href="mailto:contact@chairevision.in"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  contact@chairevision.in
                </a>
              </li>
              <li><span className="text-slate-400">नियम व अटी (Terms)</span></li>
              <li><span className="text-slate-400">गोपनीयता धोरण (Privacy)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/80 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-slate-500 text-center md:text-left">
            © 2026 <strong className="text-slate-800 font-semibold">Chai Revision</strong>. All Rights Reserved.
            Made with <Heart className="inline w-3 h-3 text-rose-500 fill-rose-500 -mt-0.5" aria-label="love" /> for Maharashtra Aspirants.
          </p>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
