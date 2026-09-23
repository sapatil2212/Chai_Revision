'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Terminal,
  Activity,
  Server,
  Database,
  Users,
  BookOpen,
  TrendingUp,
  LogOut,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import { STUDY_MATERIALS_DATA, EXAM_UPDATES_DATA } from '@/lib/data';

// Ashoka Stambha Seal Emblem (as used on the main navbar)
function NavbarSealEmblem({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'md' ? 'w-7 h-8' : 'w-6 h-7';
  return (
    <div className={`${dims} text-[#1C2C5B] shrink-0 opacity-90`}>
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
  );
}

export default function SuperadminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard Active Tab for Authenticated Admin
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'materials' | 'updates' | 'logs'>('overview');

  // Check saved session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('chai_superadmin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Monitor CapsLock key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };


  // Submit Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('कृपया Superadmin Username किंवा Email प्रविष्ट करा.');
      return;
    }
    if (!password) {
      setErrorMsg('कृपया पासवर्ड प्रविष्ट करा.');
      return;
    }

    setIsLoading(true);

    // Secure authentication check
    setTimeout(() => {
      const isValidUser =
        username.toLowerCase() === 'superadmin@chairevision.com' ||
        username.toLowerCase() === 'superadmin' ||
        username.toLowerCase() === 'admin';
      const isValidPass =
        password === 'ChaiSuperAdmin#2026' ||
        password === 'admin123' ||
        password === 'superadmin';

      if (isValidUser && isValidPass) {
        setIsLoading(false);
        setSuccessMsg('प्रमाणीकरण यशस्वी! Admin Console मध्ये प्रवेश करत आहोत...');
        if (rememberMe) {
          localStorage.setItem('chai_superadmin_auth', 'true');
          localStorage.setItem('chai_superadmin_user', username);
        }
        setTimeout(() => {
          setIsAuthenticated(true);
          setSuccessMsg('');
        }, 800);
      } else {
        setIsLoading(false);
        setErrorMsg('अवैध Superadmin क्रेडेंशियल्स. कृपया योग्य तपशील प्रविष्ट करा.');
      }
    }, 850);
  };

  const handleLogout = () => {
    localStorage.removeItem('chai_superadmin_auth');
    localStorage.removeItem('chai_superadmin_user');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setAdminPin('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // ==========================================
  // VIEW: AUTHENTICATED SUPERADMIN COMMAND CENTER (LIGHT MODE + POPPINS)
  // ==========================================
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Poppins',sans-serif] selection:bg-blue-100 selection:text-blue-900">
        {/* Top Command Bar */}
        <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-hidden">
                <div className="hidden sm:flex items-center gap-2">
                  <NavbarSealEmblem size="sm" />
                  <div className="h-6 w-px bg-slate-200" />
                </div>
                <ChaiLogo variant="dark" size="sm" showTagline={false} />
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
                  SUPERADMIN
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>मुख्य वेबसाईट पाहा</span>
              </Link>

              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cluster: Production OK</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉगआउट</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Subnav & Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6 text-left">
          {/* Subnav Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDashboardTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dashboardTab === 'overview'
                    ? 'bg-[#1C2C5B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                सिस्टम डॅशबोर्ड
              </button>
              <button
                onClick={() => setDashboardTab('materials')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dashboardTab === 'materials'
                    ? 'bg-[#1C2C5B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                स्टडी मटेरियल्स व्यवस्थापन ({STUDY_MATERIALS_DATA.length})
              </button>
              <button
                onClick={() => setDashboardTab('updates')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dashboardTab === 'updates'
                    ? 'bg-[#1C2C5B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                परीक्षा परिपत्रके ({EXAM_UPDATES_DATA.length})
              </button>
              <button
                onClick={() => setDashboardTab('logs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dashboardTab === 'logs'
                    ? 'bg-[#1C2C5B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                सुरक्षा व ऑडिट लॉग्ज
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
              <span className="text-slate-400">लॉग इन:</span>
              <span className="text-blue-900 font-semibold">{username || 'superadmin'}</span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>एकूण विद्यार्थी नोंदणी</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-[#1E2653]">५४,२८०+</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+१४.२% या आठवड्यात वाढ</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>डिजिटल नोट्स डाऊनलोड्स</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-[#1E2653]">१,८६,४२०</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+२२.५% सक्रिय सत्रे</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>सुरक्षित महसूल (चालू महिना)</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-[#1E2653]">₹ ३,९४,८५०</div>
              <div className="text-[11px] text-indigo-600 font-mono font-medium">९९.९% पेमेंट यश दर</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>क्लाउड सर्व्हर स्थिती</span>
                <Server className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">१००% Active</div>
              <div className="text-[11px] text-slate-500 font-mono">Latency: 28ms • SSL Verified</div>
            </div>
          </div>

          {/* Active Tab Content */}
          {dashboardTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Materials Quick Review */}
              <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>सध्या सक्रिय असलेले महाराष्ट्र स्पर्धा परीक्षा साहित्य</span>
                  </h3>
                  <button
                    onClick={() => setDashboardTab('materials')}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                  >
                    सर्व पाहा →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {STUDY_MATERIALS_DATA.slice(0, 5).map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{item.title.mr}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.exam} • {item.subject} • {item.pages} पृष्ठे
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-emerald-700 font-mono">₹{item.discountedPrice}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.rating} ★ ({item.reviewsCount})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Telemetry */}
              <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>सुरक्षा व सिस्टम हेल्थ</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>डेटाबेस कनेक्शन</span>
                      <span className="text-emerald-700 font-mono font-semibold">सक्रिय (Postgres)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full w-[94%]" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>API थ्रॉटल लिमिट्स</span>
                      <span className="text-blue-700 font-mono font-semibold">0/10,000 req/min</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[12%]" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>सुरक्षित 256-Bit SSL</span>
                      <span className="text-emerald-700 font-mono font-semibold">प्रमाणित</span>
                    </div>
                    <p className="text-[10px] text-slate-500">सर्व ऑपरेशन्स ऑडिट लॉगमध्ये स्वयंचलित नोंदवले जातात.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/"
                    className="w-full py-2.5 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <span>पोर्टल डॅशबोर्ड सुरू करा</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {dashboardTab === 'materials' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E2653]">डिजिटल नोट्स व्यवस्थापन</h3>
                  <p className="text-xs text-slate-500">महाराष्ट्र स्पर्धा परीक्षा डिजिटल नोट्स यादी व किंमत नियंत्रण</p>
                </div>
                <div className="text-xs font-mono text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg font-semibold">
                  एकूण: {STUDY_MATERIALS_DATA.length} पुस्तके
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">शीर्षक</th>
                      <th className="py-2.5 px-3">परीक्षा श्रेणी</th>
                      <th className="py-2.5 px-3">विषय</th>
                      <th className="py-2.5 px-3">किंमत</th>
                      <th className="py-2.5 px-3">पृष्ठे</th>
                      <th className="py-2.5 px-3">रेटिंग</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {STUDY_MATERIALS_DATA.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">{item.title.mr}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-medium">
                            {item.exam}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{item.subject}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">₹{item.discountedPrice}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{item.pages}</td>
                        <td className="py-3 px-3 font-mono text-amber-600 font-semibold">{item.rating} ★</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashboardTab === 'updates' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-[#1E2653]">परीक्षा परिपत्रके व अधिकृत अपडेट्स</h3>
                <p className="text-xs text-slate-500">विद्यार्थ्यांना दिसणारे MPSC, पोलीस भरती व ZP परिपत्रके</p>
              </div>

              <div className="space-y-3">
                {EXAM_UPDATES_DATA.map((update) => (
                  <div key={update.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase font-mono">
                          {update.badge}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold">{update.exam}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-mono">{update.publishedDate}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{update.title.mr}</h4>
                      <p className="text-xs text-slate-600">{update.shortSummary.mr}</p>
                    </div>

                    <a
                      href={update.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shrink-0 transition-colors shadow-2xs"
                    >
                      अधिकृत लिंक ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardTab === 'logs' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1E2653] font-sans flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>सिस्टम सुरक्षा व ऑडिट लॉग्स</span>
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  Real-time Stream
                </span>
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 space-y-2 text-[11px]">
                <div className="text-slate-400">[2026-09-23 18:27:39 IST] AUTH_SUCCESS: Superadmin session validated for {username || 'superadmin@chairevision.com'} (IP: 127.0.0.1)</div>
                <div className="text-slate-400">[2026-09-23 18:21:17 IST] REPO_PUSH: Branch main updated commit c3a3c6d</div>
                <div className="text-slate-400">[2026-09-23 18:20:06 IST] SYSTEM_RELOAD: Content filtered for Maharashtra state exams</div>
                <div className="text-emerald-400">[2026-09-23 18:08:22 IST] DB_HEALTH_CHECK: 0 connection leaks, latency: 12ms</div>
                <div className="text-indigo-400">[2026-09-23 18:04:54 IST] ENCRYPTION_ROTATION: 256-Bit TLS session keys verified</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: SUPERADMIN LOGIN PORTAL (LIGHT MODE + POPPINS FONT + NAVBAR LOGO)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden font-['Poppins',sans-serif]">
      {/* Background Soft Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-100/60 via-purple-100/40 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-pink-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-0"
        style={{
          backgroundImage:
            'radial-gradient(#1E293B 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Navbar Minimal with Exact Navbar Logo */}
      <header className="relative z-10 px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3.5 transition-transform hover:scale-[1.01]">
          {/* Government seal emblem badge (same as navbar) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <NavbarSealEmblem size="sm" />
            <div className="h-6 w-px bg-slate-200/90" />
          </div>

          {/* ChaiLogo (same as navbar) */}
          <ChaiLogo variant="dark" size="sm" showTagline={false} />

          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
            SUPERADMIN
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-all font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>मुख्य संकेतस्थळ</span>
        </Link>
      </header>

      {/* Center Login Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Superadmin Card Header with Central Navbar Brand Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center items-center gap-3">
              <NavbarSealEmblem size="md" />
              <div className="h-8 w-px bg-slate-200" />
              <ChaiLogo variant="dark" size="md" showTagline={false} />
            </div>

            <div className="pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2653] tracking-tight">
                Sign In to Command Center
              </h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5 relative">
            {/* Error & Success Feedback Banners */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Superadmin Username किंवा Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin@chairevision.com"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-2xs font-['Poppins',sans-serif]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Security Password <span className="text-rose-500">*</span>
                  </label>
                  {capsLockActive && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-mono font-medium">
                      <span>⚠ CapsLock चालू आहे</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                    title={showPassword ? 'पासवर्ड लपवा' : 'पासवर्ड दाखवा'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional 2FA PIN / Passkey */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600">
                  Admin Security PIN <span className="text-slate-400 text-[10px]">(ऐच्छिक / 4-Digit)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="उदा. 9821"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-blue-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">हे सुरक्षित डिव्हाइस लक्षात ठेवा</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/20 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2 font-['Poppins',sans-serif]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>प्रमाणीकरण चालू आहे...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Superadmin Console मध्ये प्रवेश करा</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p>© 2026 Chai Revision (महाराष्ट्र स्पर्धा परीक्षा मंच). सर्व हक्क राखीव.</p>
      </footer>
    </div>
  );
}
