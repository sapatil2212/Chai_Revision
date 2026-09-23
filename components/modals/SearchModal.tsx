'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA, COURSES_DATA, PYQS_DATA, EXAM_UPDATES_DATA, BLOG_POSTS_DATA } from '@/lib/data';
import { Search, X, BookOpen, GraduationCap, HelpCircle, Bell, Newspaper, ArrowRight } from 'lucide-react';

export function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, lang, navigateTo } = useApp();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'courses' | 'pyq' | 'updates' | 'blogs'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredMaterials = STUDY_MATERIALS_DATA.filter((m) =>
    !q || m.title[lang]?.toLowerCase().includes(q) || m.exam.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)
  );

  const filteredCourses = COURSES_DATA.filter((c) =>
    !q || c.title[lang]?.toLowerCase().includes(q) || c.exam.toLowerCase().includes(q)
  );

  const filteredPYQs = PYQS_DATA.filter((p) =>
    !q || p.question[lang]?.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q)
  );

  const filteredUpdates = EXAM_UPDATES_DATA.filter((u) =>
    !q || u.title[lang]?.toLowerCase().includes(q) || u.exam.toLowerCase().includes(q)
  );

  const filteredBlogs = BLOG_POSTS_DATA.filter((b) =>
    !q || b.title[lang]?.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
  );

  const suggestions = [
    'MPSC Polity Notes',
    'महाराष्ट्र भूगोल नकाशे',
    'तलाठी मराठी व्याकरण',
    'चालू घडामोडी २०२६',
    'सत्यशोधक समाज PYQ',
    'पोलीस भरती GK',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="तुम्हाला काय शिकायचे आहे? उदा. MPSC Polity, Geography Notes..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-900 px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold shrink-0">सुझाव:</span>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(item)}
              className="bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-200 whitespace-nowrap transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            सर्व ({filteredMaterials.length + filteredCourses.length + filteredPYQs.length + filteredUpdates.length + filteredBlogs.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'materials' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Materials ({filteredMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'courses' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Courses ({filteredCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('pyq')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'pyq' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            PYQs ({filteredPYQs.length})
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'updates' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Updates ({filteredUpdates.length})
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'blogs' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Blogs ({filteredBlogs.length})
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {/* Study Materials */}
          {(activeTab === 'all' || activeTab === 'materials') && filteredMaterials.length > 0 && (
            <div className="space-y-2 pt-2 first:pt-0">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Study Materials ({filteredMaterials.length})
              </h4>
              <div className="space-y-1.5">
                {filteredMaterials.slice(0, 4).map((mat) => (
                  <div
                    key={mat.id}
                    onClick={() => {
                      navigateTo('materials', { slug: mat.slug });
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-blue-50/50 cursor-pointer flex items-center justify-between gap-3 border border-transparent hover:border-blue-100 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={mat.coverImage} alt={mat.title[lang]} className="w-10 h-12 object-cover rounded-md shadow-2xs shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{mat.title[lang]}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-blue-600">{mat.exam}</span>
                          <span>•</span>
                          <span>{mat.pages} पृष्ठे</span>
                          <span>•</span>
                          <span className="font-bold text-slate-900">{mat.isFree ? 'मोफत' : `₹${mat.discountedPrice}`}</span>
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Updates */}
          {(activeTab === 'all' || activeTab === 'updates') && filteredUpdates.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Exam Updates ({filteredUpdates.length})
              </h4>
              <div className="space-y-1.5">
                {filteredUpdates.map((upd) => (
                  <div
                    key={upd.id}
                    onClick={() => {
                      navigateTo('exam-updates', { slug: upd.slug });
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-blue-50/50 cursor-pointer flex items-center justify-between gap-3 border border-transparent hover:border-blue-100 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold shadow-2xs">
                          {upd.badge}
                        </span>
                        <p className="text-xs font-bold text-slate-900 truncate">{upd.title[lang]}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{upd.shortSummary[lang]}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PYQs */}
          {(activeTab === 'all' || activeTab === 'pyq') && filteredPYQs.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Previous Year Questions ({filteredPYQs.length})
              </h4>
              <div className="space-y-1.5">
                {filteredPYQs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigateTo('pyq', { id: item.id });
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-blue-50/50 cursor-pointer border border-transparent hover:border-blue-100 transition-all"
                  >
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{item.question[lang]}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-bold text-blue-600">{item.exam} {item.year}</span>
                      <span>•</span>
                      <span>{item.topic}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredMaterials.length === 0 && filteredUpdates.length === 0 && filteredPYQs.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">काहीही सापडले नाही</p>
              <p className="text-xs text-slate-500 mt-1">
                &ldquo;{query}&rdquo; साठी कोणतेही साहित्य किंवा प्रश्न सापडले नाहीत. कृपया दुसरा शब्द वापरून शोधा.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
