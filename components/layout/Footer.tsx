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

// Reusable footer link with animated arrow + underline on hover
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
      className={`group inline-flex items-center gap-1 text-left cursor-pointer transition-colors duration-200 focus:outline-hidden focus-visible:text-amber-300 ${
        highlight ? 'text-emerald-400 hover:text-emerald-300 font-semibold' : 'text-slate-400 hover:text-amber-300'
      }`}
    >
      <ChevronRight
        className="w-3 h-3 -ml-4 opacity-0 group-hover:ml-0 group-hover:opacity-100 transition-all duration-200"
        aria-hidden="true"
      />
      <span className="relative">
        {children}
        <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-current group-hover:w-full transition-all duration-300" />
      </span>
    </button>
  );
}

const SOCIALS = [
  { href: 'https://t.me', title: 'Telegram Channel', Icon: Send, hover: 'hover:bg-sky-500 hover:border-sky-400 hover:shadow-sky-500/30' },
  { href: 'https://whatsapp.com', title: 'WhatsApp Study Group', Icon: MessageCircle, hover: 'hover:bg-emerald-500 hover:border-emerald-400 hover:shadow-emerald-500/30' },
  { href: 'https://youtube.com', title: 'YouTube Video Revision', Icon: Youtube, hover: 'hover:bg-red-500 hover:border-red-400 hover:shadow-red-500/30' },
  { href: 'https://instagram.com', title: 'Instagram', Icon: Instagram, hover: 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:border-pink-400 hover:shadow-pink-500/30' },
];

const TRUST_ITEMS = [
  { Icon: ShieldCheck, title: '१००% सुरक्षित पेमेंट्स', sub: 'Razorpay एनक्रिप्टेड चेकआउट', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  { Icon: CheckCircle2, title: 'झटपट डिजिटल प्रवेश', sub: 'पेमेंटनंतर क्षणात PDF डाऊनलोड', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { Icon: Mail, title: 'विद्यार्थी सहाय्यता', sub: 'WhatsApp व ईमेल सपोर्ट २४x७', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { Icon: Heart, title: 'टॉपर्सचे पसंतीचे संकलन', sub: 'परीक्षानिहाय अचूक विश्लेषण', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
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
    <footer className="relative mt-16 overflow-hidden bg-[#0B0B0F] text-slate-400 pt-16 pb-24 lg:pb-10">
      {/* Decorative amber glow + top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-20 w-[400px] h-[300px] rounded-full bg-orange-600/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#FBBF24 1px, transparent 1px)', backgroundSize: '26px 26px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Trust Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-14">
          {TRUST_ITEMS.map(({ Icon, title, sub, color }) => (
            <div
              key={title}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 text-left">
          {/* Brand */}
          <div className="col-span-2 space-y-5">
            <button onClick={() => navigateTo('home')} className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]" title="Chai Revision Home">
              <ChaiLogo size="lg" />
            </button>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              स्पर्धा परीक्षेच्या तयारीसाठी तुमचा Smart Study Companion. दर्जेदार नोट्स, प्रॅक्टिस पेपर्स आणि परीक्षेचे अचूक मार्गदर्शन.
            </p>
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ href, title, Icon, hover }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={title}
                  aria-label={title}
                  className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${hover}`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 rounded-full bg-amber-400" />
              साहित्य व विभाग
            </h4>
            <ul className="space-y-3 text-xs">
              <li><FooterLink onClick={() => navigateTo('materials')}>Study Materials</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('quiz')}>MCQ सराव / Quiz</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('pyq')}>PYQ प्रश्नसंच</FooterLink></li>
              <li>
                <FooterLink onClick={() => navigateTo('free-resources')} highlight>
                  <span className="inline-flex items-center gap-1">
                    मोफत साहित्य (Free) <Sparkles className="w-3 h-3" aria-hidden="true" />
                  </span>
                </FooterLink>
              </li>
              <li><FooterLink onClick={() => navigateTo('blogs')}>अभ्यास ब्लॉग्स</FooterLink></li>
            </ul>
          </div>

          {/* Exams */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 rounded-full bg-amber-400" />
              प्रमुख स्पर्धा परीक्षा
            </h4>
            <ul className="space-y-3 text-xs">
              {EXAMS.map((exam) => (
                <li key={exam}>
                  <FooterLink onClick={() => navigateTo('materials')}>{exam}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 rounded-full bg-amber-400" />
              मदत व कायदेशीर
            </h4>
            <ul className="space-y-3 text-xs">
              <li><FooterLink onClick={() => navigateTo('exam-updates')}>परीक्षा अपडेट्स</FooterLink></li>
              <li><FooterLink onClick={() => navigateTo('important-dates')}>महत्वाच्या तारखा कॅलेंडर</FooterLink></li>
              <li>
                <a
                  href="mailto:contact@chairevision.in"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  contact@chairevision.in
                </a>
              </li>
              <li><span className="text-slate-500">नियम व अटी (Terms)</span></li>
              <li><span className="text-slate-500">गोपनीयता धोरण (Privacy)</span></li>
              <li><span className="text-slate-500">परतावा धोरण (Refunds)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 text-center md:text-left">
            © 2026 <span className="text-slate-300 font-semibold">Chai Revision</span>. All Rights Reserved.
            Made with <Heart className="inline w-3 h-3 text-rose-500 fill-rose-500 -mt-0.5" aria-label="love" /> for Maharashtra Aspirants.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              title="Back to top"
              className="group w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
