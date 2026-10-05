'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { canDownloadFree, materialDownloadUrl } from '@/lib/materialLinks';
import { pyqApi } from '@/lib/pyqClient';
import type { PyqFilterOptions } from '@/lib/pyqTypes';
import { quizStatus } from '@/lib/quizTypes';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

const T = {
  mr: {
    badge: '१००% मोफत अभ्यास साहित्य',
    heading: 'मोफत डिजिटल लायब्ररी',
    sub: 'कोणतेही शुल्क न भरता डाऊनलोड करा आणि सराव करा — अधिकृत अभ्यासक्रम, नमुना नोट्स, मागील वर्षांचे प्रश्न आणि मोफत टेस्ट्स.',
    pdfTitle: 'मोफत PDF डाऊनलोड',
    pdfSub: 'वैयक्तिक अभ्यासासाठी विनामूल्य उपलब्ध फाइल्स.',
    searchPh: 'साहित्य शोधा…',
    allExams: 'सर्व परीक्षा',
    pages: 'पृष्ठे',
    preview: 'नमुना पाहा',
    download: 'मोफत डाऊनलोड करा',
    started: 'डाऊनलोड सुरू झाले!',
    soon: 'PDF लवकरच',
    downloads: 'डाऊनलोड',
    noPdf: 'सध्या मोफत PDF उपलब्ध नाही',
    noPdfMatch: 'या शोधासाठी साहित्य सापडले नाही.',
    allMaterials: 'सर्व अभ्यास साहित्य पाहा',
    pyqTitle: 'मोफत PYQ सराव',
    pyqSub: 'मागील वर्षांचे खरे प्रश्न — उत्तरांसह व सविस्तर स्पष्टीकरणासह, पूर्णपणे मोफत.',
    pyqQuestions: 'प्रश्न',
    pyqYears: 'वर्षे',
    pyqExams: 'परीक्षा',
    pyqCta: 'PYQ सराव सुरू करा',
    pyqEmpty: 'मागील वर्षांचे प्रश्न लवकरच जोडले जातील.',
    quizTitle: 'मोफत मॉक टेस्ट्स',
    quizSub: 'वेळेसह ऑनलाइन टेस्ट द्या, निकाल व गुणवत्ता यादी त्वरित पाहा — मोफत.',
    quizCta: 'सर्व टेस्ट्स पाहा',
    quizQuestions: 'प्रश्न',
    quizMin: 'मि.',
    quizTake: 'टेस्ट द्या',
    quizEmpty: 'सध्या एकही टेस्ट सुरू नाही. लवकरच नवीन टेस्ट्स येतील.',
    notice: 'सर्व मोफत फाइल्स वैयक्तिक अभ्यासासाठी विनामूल्य आहेत. सुरक्षित डाऊनलोड लिंकद्वारे त्वरित डाउनलोड उपलब्ध होते.',
  },
  en: {
    badge: '100% free study material',
    heading: 'Free Digital Library',
    sub: 'Download and practise at zero cost — official syllabus, sample notes, real previous-year questions and free mock tests.',
    pdfTitle: 'Free PDF downloads',
    pdfSub: 'Files available at no cost for personal study.',
    searchPh: 'Search materials…',
    allExams: 'All exams',
    pages: 'pages',
    preview: 'Preview sample',
    download: 'Download free',
    started: 'Download started!',
    soon: 'PDF coming soon',
    downloads: 'downloads',
    noPdf: 'No free PDFs are available yet',
    noPdfMatch: 'No material matches this search.',
    allMaterials: 'Browse all study materials',
    pyqTitle: 'Free PYQ practice',
    pyqSub: 'Genuine questions from past papers, with answers and detailed explanations. Completely free.',
    pyqQuestions: 'questions',
    pyqYears: 'years',
    pyqExams: 'exams',
    pyqCta: 'Start PYQ practice',
    pyqEmpty: 'Previous-year questions are coming soon.',
    quizTitle: 'Free mock tests',
    quizSub: 'Take a timed online test and see your result and rank instantly — free.',
    quizCta: 'See all tests',
    quizQuestions: 'questions',
    quizMin: 'min',
    quizTake: 'Take test',
    quizEmpty: 'No test is open right now. New tests are added regularly.',
    notice: 'Every free file is available at no cost for personal study, served instantly over a secure download link.',
  },
  hi: {
    badge: '100% मुफ्त अध्ययन सामग्री',
    heading: 'मुफ्त डिजिटल लाइब्रेरी',
    sub: 'बिना किसी शुल्क के डाउनलोड करें और अभ्यास करें — आधिकारिक पाठ्यक्रम, नमूना नोट्स, पिछले वर्षों के प्रश्न और मुफ्त मॉक टेस्ट।',
    pdfTitle: 'मुफ्त PDF डाउनलोड',
    pdfSub: 'व्यक्तिगत अध्ययन के लिए नि:शुल्क उपलब्ध फाइलें।',
    searchPh: 'सामग्री खोजें…',
    allExams: 'सभी परीक्षाएं',
    pages: 'पृष्ठ',
    preview: 'नमूना देखें',
    download: 'मुफ्त डाउनलोड करें',
    started: 'डाउनलोड शुरू हुआ!',
    soon: 'PDF शीघ्र उपलब्ध',
    downloads: 'डाउनलोड',
    noPdf: 'अभी कोई मुफ्त PDF उपलब्ध नहीं है',
    noPdfMatch: 'इस खोज के लिए कोई सामग्री नहीं मिली।',
    allMaterials: 'सभी अध्ययन सामग्री देखें',
    pyqTitle: 'मुफ्त PYQ अभ्यास',
    pyqSub: 'पिछले वर्षों के वास्तविक प्रश्न — उत्तर एवं विस्तृत व्याख्या सहित, पूर्णतः मुफ्त।',
    pyqQuestions: 'प्रश्न',
    pyqYears: 'वर्ष',
    pyqExams: 'परीक्षाएं',
    pyqCta: 'PYQ अभ्यास शुरू करें',
    pyqEmpty: 'पिछले वर्षों के प्रश्न शीघ्र जोड़े जाएंगे।',
    quizTitle: 'मुफ्त मॉक टेस्ट',
    quizSub: 'समयबद्ध ऑनलाइन टेस्ट दें, परिणाम और रैंक तुरंत देखें — मुफ्त।',
    quizCta: 'सभी टेस्ट देखें',
    quizQuestions: 'प्रश्न',
    quizMin: 'मि.',
    quizTake: 'टेस्ट दें',
    quizEmpty: 'अभी कोई टेस्ट उपलब्ध नहीं है। नए टेस्ट नियमित रूप से जोड़े जाते हैं।',
    notice: 'सभी मुफ्त फाइलें व्यक्तिगत अध्ययन के लिए नि:शुल्क हैं और सुरक्षित डाउनलोड लिंक द्वारा तुरंत उपलब्ध होती हैं।',
  },
};

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/**
 * Everything on Chai Revision that costs nothing: free PDFs from the study-material
 * catalogue, the previous-year question bank and whichever mock tests are open now.
 */
export function FreeResourcesView() {
  const { lang, t: i18n, setPreviewProduct, navigateTo, materials, quizzes } = useApp();
  const t = T[lang] ?? T.mr;

  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState('All');
  const [pyqStats, setPyqStats] = useState<PyqFilterOptions | null>(null);

  // PYQ counts are the only thing not already in the app store
  useEffect(() => {
    let alive = true;
    pyqApi
      .filters()
      .then((f) => alive && setPyqStats(f))
      .catch(() => alive && setPyqStats({ exams: [], years: [], subjects: [], topics: [], sources: [], total: 0 }));
    return () => {
      alive = false;
    };
  }, []);

  const freeItems = useMemo(() => materials.filter((m) => m.isFree), [materials]);
  const exams = useMemo(() => [...new Set(freeItems.map((m) => m.exam))].sort(), [freeItems]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return freeItems.filter((m) => {
      if (exam !== 'All' && m.exam !== exam) return false;
      if (!q) return true;
      return [m.title[lang], m.title.en, m.description[lang], m.subject, m.exam]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [freeItems, exam, query, lang]);

  // Only tests that are open right now are genuinely usable from here
  const liveQuizzes = useMemo(() => quizzes.filter((q) => quizStatus(q) === 'live').slice(0, 4), [quizzes]);

  // The browser handles the actual file download; this only shows confirmation feedback
  const markDownloaded = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => setDownloadedId((cur) => (cur === id ? null : cur)), 3000);
  };

  const card = 'bg-white border border-slate-200 rounded-2xl shadow-xs';

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Page header */}
        <header>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            {t.badge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            {i18n.nav.freeResources} — {t.heading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">{t.sub}</p>
        </header>

        {/* ---------------- Free PDFs ---------------- */}
        <section className="space-y-4" aria-labelledby="free-pdf-title">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div id="free-pdf-title">
              <SectionHeader icon={<FileText className="w-4 h-4" />} title={t.pdfTitle} sub={t.pdfSub} />
            </div>

            {freeItems.length > 2 && (
              <div className="flex gap-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchPh}
                    aria-label={t.searchPh}
                    className="w-full sm:w-56 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                {exams.length > 1 && (
                  <select
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    aria-label={t.allExams}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="All">{t.allExams}</option>
                    {exams.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleItems.map((item) => (
              <article key={item.id} className={`${card} p-5 flex flex-col justify-between text-left hover:border-emerald-400 transition-colors`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-xs">FREE PDF</span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {item.pages} {t.pages} • {item.language}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- covers can be any https URL, which next/image is not configured for */}
                    <img
                      src={item.coverImage}
                      alt=""
                      className="w-16 h-20 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase">{item.exam}</span>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">{item.title[lang]}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description[lang]}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setPreviewProduct(item)}
                      className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>{t.preview}</span>
                    </button>
                    {!!item.downloadCount && item.downloadCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.downloadCount.toLocaleString('en-IN')} {t.downloads}
                      </span>
                    )}
                  </div>

                  {canDownloadFree(item) ? (
                    <a
                      href={materialDownloadUrl(item.slug)}
                      onClick={() => markDownloaded(item.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shadow-emerald-500/20"
                    >
                      {downloadedId === item.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.started}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {t.download}
                            {item.fileSize ? ` (${item.fileSize})` : ''}
                          </span>
                        </>
                      )}
                    </a>
                  ) : (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl">{t.soon}</span>
                  )}
                </div>
              </article>
            ))}

            {visibleItems.length === 0 && (
              <div className="md:col-span-2 bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-700">{freeItems.length === 0 ? t.noPdf : t.noPdfMatch}</p>
                <button
                  onClick={() => navigateTo('materials')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  {t.allMaterials} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------------- Free PYQ practice ---------------- */}
        <section className="space-y-4" aria-labelledby="free-pyq-title">
          <div id="free-pyq-title">
            <SectionHeader icon={<HelpCircle className="w-4 h-4" />} title={t.pyqTitle} sub={t.pyqSub} />
          </div>

          <div className={`${card} p-5 sm:p-6`}>
            {pyqStats && pyqStats.total > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <dl className="grid grid-cols-3 gap-3 sm:gap-6 text-center sm:text-left">
                  {[
                    [pyqStats.total, t.pyqQuestions],
                    [pyqStats.years.length, t.pyqYears],
                    [pyqStats.exams.length, t.pyqExams],
                  ].map(([value, label]) => (
                    <div key={String(label)}>
                      <dd className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">{value}</dd>
                      <dt className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</dt>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => navigateTo('pyq')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
                >
                  {t.pyqCta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">{pyqStats ? t.pyqEmpty : '…'}</p>
            )}

            {pyqStats && pyqStats.years.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
                {pyqStats.years.slice(0, 10).map((y) => (
                  <span key={y} className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                    {y}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------------- Free mock tests ---------------- */}
        <section className="space-y-4" aria-labelledby="free-quiz-title">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div id="free-quiz-title">
              <SectionHeader icon={<Target className="w-4 h-4" />} title={t.quizTitle} sub={t.quizSub} />
            </div>
            {liveQuizzes.length > 0 && (
              <button
                onClick={() => navigateTo('quiz')}
                className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                {t.quizCta} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {liveQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveQuizzes.map((q) => (
                <article key={q.id} className={`${card} p-4 flex items-center justify-between gap-3 hover:border-emerald-400 transition-colors`}>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      {q.exam} • {q.subject}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">{q.title[lang === 'en' ? 'en' : 'mr']}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>
                        {q.questionCount} {t.quizQuestions}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {q.durationMinutes} {t.quizMin}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigateTo('quiz', { slug: q.slug })}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {t.quizTake}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <Target className="w-7 h-7 text-slate-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">{t.quizEmpty}</p>
            </div>
          )}
        </section>

        {/* Trust notice */}
        <div className={`${card} p-4 text-xs text-slate-600 flex items-center gap-3`}>
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{t.notice}</span>
        </div>
      </div>
    </div>
  );
}
