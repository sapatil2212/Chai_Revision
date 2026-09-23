'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import {
  MessageCircle,
  Youtube,
  Send,
  Instagram,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Heart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function Footer() {
  const { setLang, navigateTo } = useApp();

  return (
    <footer className="bg-gradient-to-b from-[#F8FAFC] via-slate-100/40 to-slate-100/80 text-slate-600 pt-14 pb-24 lg:pb-12 border-t border-slate-200/80 mt-16 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Trust Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-12 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left shadow-2xs">
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">१००% सुरक्षित पेमेंट्स</p>
              <p className="text-xs text-slate-500 font-normal">Razorpay एनक्रिप्टेड चेकआउट</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">झटपट डिजिटल प्रवेश</p>
              <p className="text-xs text-slate-500 font-normal">पेमेंटनंतर क्षणात PDF डाऊनलोड</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">विद्यार्थी सहाय्यता</p>
              <p className="text-xs text-slate-500 font-normal">WhatsApp व ईमेल सपोर्ट २४x७</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">टॉपर्सचे पसंतीचे संकलन</p>
              <p className="text-xs text-slate-500 font-normal">परीक्षानिहाय अचूक विश्लेषण</p>
            </div>
          </div>
        </div>

        {/* 4 Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 text-left">
          {/* Column 1: Brand Info */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <ChaiLogo variant="dark" size="lg" />
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              स्पर्धा परीक्षेच्या तयारीसाठी तुमचा Smart Study Companion. दर्जेदार नोट्स, प्रॅक्टिस पेपर्स, चालू घडामोडी आणि परीक्षेचे अचूक मार्गदर्शन.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="Telegram Channel"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="WhatsApp Study Group"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="YouTube Video Revision"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50 text-slate-600 hover:text-pink-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="Instagram Current Affairs"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              साहित्य व विभाग
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  Study Materials
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('courses')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  कोर्सेस (Courses)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('pyq')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  PYQ प्रश्नसंच
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('current-affairs')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  चालू घडामोडी
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('free-resources')} className="text-emerald-700 hover:text-emerald-800 transition-colors text-left font-bold cursor-pointer flex items-center gap-1">
                  <span>मोफत साहित्य (Free)</span>
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('blogs')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  अभ्यास ब्लॉग्स
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Exams */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              प्रमुख स्पर्धा परीक्षा
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  MPSC राज्यसेवा
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  PSI / STI / ASO संयुक्त
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  तलाठी भरती (TCS)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  महाराष्ट्र पोलीस भरती
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  जिल्हा परिषद व सरळसेवा
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('materials')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  TET / TAIT शिक्षक भरती
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Policies */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              मदत व कायदेशीर
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigateTo('exam-updates')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  परीक्षा अपडेट्स
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('important-dates')} className="text-slate-600 hover:text-blue-600 transition-colors text-left cursor-pointer">
                  महत्वाच्या तारखा कॅलेंडर
                </button>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">सपोर्ट: contact@chairevision.in</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">नियम व अटी (Terms)</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">गोपनीयता धोरण (Privacy)</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">परतावा धोरण (Refunds)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© २०२६ Chai Revision (चाय रिव्हिजन). सर्व हक्क राखीव. Made with care for Maharashtra Aspirants.</p>

          <div className="flex flex-wrap items-center gap-3">
            <span>भाषा:</span>
            <button onClick={() => setLang('mr')} className="hover:text-blue-600 font-semibold cursor-pointer">
              मराठी
            </button>
            <span>•</span>
            <button onClick={() => setLang('en')} className="hover:text-blue-600 font-semibold cursor-pointer">
              English
            </button>
            <span>•</span>
            <button onClick={() => setLang('hi')} className="hover:text-blue-600 font-semibold cursor-pointer">
              हिन्दी
            </button>
            <span>•</span>
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 font-medium transition-colors"
              title="Superadmin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>प्रशासन पोर्टल</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
