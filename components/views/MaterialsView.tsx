'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { EXAM_CATEGORIES_DATA } from '@/lib/data';
import { MATERIAL_TYPE_OPTIONS, SUBJECT_LABELS_MR, SUBJECT_OPTIONS } from '@/lib/adminOptions';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ProductDetailView } from './ProductDetailView';
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { ExamCategory } from '@/lib/types';

export function MaterialsView() {
  const { viewParams } = useApp();

  if (viewParams.slug) {
    return <ProductDetailView />;
  }

  return <MaterialsCatalog />;
}

function MaterialsCatalog() {
  const { viewParams, lang, t, materials } = useApp();

  const [selectedExam, setSelectedExam] = useState<string>(viewParams.exam || 'All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('bestseller');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter options come from the live catalog, so every option always has results
  const subjects = useMemo(
    () => ['All', ...SUBJECT_OPTIONS.filter((s) => materials.some((m) => m.subject === s))],
    [materials]
  );
  const materialTypes = useMemo(
    () => ['All', ...MATERIAL_TYPE_OPTIONS.filter((t) => materials.some((m) => m.materialType === t))],
    [materials]
  );
  const examCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of materials) counts[m.exam] = (counts[m.exam] || 0) + 1;
    return counts;
  }, [materials]);
  const subjectLabel = (s: string) => (s === 'All' ? (lang === 'en' ? 'All' : 'सर्व') : lang === 'en' ? s : SUBJECT_LABELS_MR[s] || s);

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Exam filter
      if (selectedExam !== 'All' && item.exam !== selectedExam) return false;
      // Subject filter
      if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
      // Type filter
      if (selectedType !== 'All' && item.materialType !== selectedType) return false;
      // Price filter
      if (selectedPrice === 'free' && !item.isFree) return false;
      if (selectedPrice === 'under99' && (item.isFree || item.discountedPrice > 99)) return false;
      if (selectedPrice === '100-199' && (item.discountedPrice < 100 || item.discountedPrice > 199)) return false;
      if (selectedPrice === '200plus' && item.discountedPrice < 200) return false;

      // Text search
      if (searchFilter.trim()) {
        const q = searchFilter.trim().toLowerCase();
        const haystack = [
          item.title.en, item.title.mr, item.title.hi, item.exam, item.subject,
          SUBJECT_LABELS_MR[item.subject], item.materialType, ...(item.tags || []),
        ].join(' ').toLowerCase();
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.discountedPrice - b.discountedPrice;
      if (sortBy === 'price-desc') return b.discountedPrice - a.discountedPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'bestseller') {
        // Bestsellers first, then featured; otherwise keep the admin's display order
        const score = (p: typeof a) => (p.bestseller ? 2 : 0) + (p.featured ? 1 : 0);
        return score(b) - score(a);
      }
      return 0;
    });
  }, [materials, selectedExam, selectedSubject, selectedType, selectedPrice, searchFilter, sortBy, lang]);

  const clearAllFilters = () => {
    setSelectedExam('All');
    setSelectedSubject('All');
    setSelectedType('All');
    setSelectedPrice('All');
    setSearchFilter('');
    setSortBy('bestseller');
  };

  const hasActiveFilters =
    selectedExam !== 'All' ||
    selectedSubject !== 'All' ||
    selectedType !== 'All' ||
    selectedPrice !== 'All' ||
    searchFilter !== '';

  return (
    <div className="bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 min-h-screen py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-left">
        {/* Page Title & Breadcrumb Header */}
        <div className="mb-5">
          <span className="text-[11px] font-medium text-slate-600 tracking-wide uppercase bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full inline-block">
            डिजिटल लायब्ररी
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mt-1">
            {t.materials.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
            {t.materials.subtitle}
          </p>
        </div>

        {/* Search & Mobile Filter Trigger Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="साहित्य शोधा (उदा. MPSC, Polity, Maths)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-200 transition-all font-normal"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-slate-400"
              >
                <option value="bestseller">{t.materials.sortBestseller}</option>
                <option value="rating">{t.materials.sortRating}</option>
                <option value="price-asc">{t.materials.sortPriceLow}</option>
                <option value="price-desc">{t.materials.sortPriceHigh}</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>फिल्टर्स {hasActiveFilters && '•'}</span>
            </button>
          </div>
        </div>

        {/* Layout: Desktop Sidebar (3 Cols) + Product Grid (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-5 shadow-2xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-500" />
                <span>{t.materials.filters}</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                >
                  {t.materials.clearAll}
                </button>
              )}
            </div>

            {/* Exam Filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider block">
                {t.materials.filterExam}
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedExam('All')}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedExam === 'All'
                      ? 'bg-slate-900 text-white font-medium shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-600 font-normal'
                  }`}
                >
                  <span>सर्व परीक्षा (All)</span>
                  <span className="text-[10px] opacity-70">{materials.length}</span>
                </button>
                {EXAM_CATEGORIES_DATA.filter((ex) => examCounts[ex.id]).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExam(ex.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedExam === ex.id
                        ? 'bg-slate-900 text-white font-medium shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 font-normal'
                    }`}
                  >
                    <span>{ex.name[lang]}</span>
                    <span className="text-[10px] opacity-70">{examCounts[ex.id]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider block">
                {t.materials.filterSubject}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors border cursor-pointer ${
                      selectedSubject === sub
                        ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {subjectLabel(sub)}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Type Filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider block">
                {t.materials.filterType}
              </span>
              <div className="space-y-1">
                {materialTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      selectedType === type
                        ? 'bg-slate-900 text-white font-medium shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 font-normal'
                    }`}
                  >
                    {type === 'All' ? (lang === 'en' ? 'All' : 'सर्व') : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider block">
                किंमत (Price)
              </span>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'All', label: 'सर्व किमती' },
                  { id: 'free', label: 'विनामूल्य (Free Only)' },
                  { id: 'under99', label: '₹९९ च्या आत' },
                  { id: '100-199', label: '₹१०० - ₹१९९' },
                  { id: '200plus', label: '₹२०० पेक्षा जास्त' },
                ].map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setSelectedPrice(pr.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      selectedPrice === pr.id
                        ? 'bg-slate-900 text-white font-medium shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 font-normal'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Results Column (9 Cols) */}
          <div className="lg:col-span-9 space-y-4">
            {/* Results Counter Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                <strong className="text-slate-900 font-medium">{filteredMaterials.length}</strong> अभ्यास साहित्य उपलब्ध
              </span>
              {hasActiveFilters && (
                <span className="text-slate-700 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">फिल्टर लागू आहेत</span>
              )}
            </div>

            {/* Products Grid */}
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMaterials.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-2xs">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-medium text-base text-slate-900">
                  कोणतेही अभ्यास साहित्य सापडले नाही
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                  तुमच्या निवडलेल्या निकषांशी जुळणारे साहित्य उपलब्ध नाही. कृपया इतर फिल्टर्स निवडून पहा.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  सर्व फिल्टर्स रिसेट करा
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
