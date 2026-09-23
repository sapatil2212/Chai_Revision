'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA, EXAM_CATEGORIES_DATA } from '@/lib/data';
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
  const { viewParams, lang, t } = useApp();

  const [selectedExam, setSelectedExam] = useState<string>(viewParams.exam || 'All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('bestseller');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const subjects = ['All', 'राज्यघटना', 'इतिहास', 'भूगोल', 'मराठी व्याकरण', 'चालू घडामोडी', 'सामान्य ज्ञान'];
  const materialTypes = ['All', 'Short Revision Notes', 'PYQ Solutions', 'Formula Sheet', 'Question Bank', 'Mind Maps'];

  const filteredMaterials = useMemo(() => {
    return STUDY_MATERIALS_DATA.filter((item) => {
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
        const q = searchFilter.toLowerCase();
        const matchesTitle = item.title[lang]?.toLowerCase().includes(q);
        const matchesExam = item.exam.toLowerCase().includes(q);
        const matchesSubject = item.subject.toLowerCase().includes(q);
        if (!matchesTitle && !matchesExam && !matchesSubject) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.discountedPrice - b.discountedPrice;
      if (sortBy === 'price-desc') return b.discountedPrice - a.discountedPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'bestseller') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      return 0;
    });
  }, [selectedExam, selectedSubject, selectedType, selectedPrice, searchFilter, sortBy, lang]);

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
    <div className="bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-left">
        {/* Page Title & Breadcrumb Header */}
        <div className="mb-6">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full inline-block">
            डिजिटल लायब्ररी
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {t.materials.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.materials.subtitle}
          </p>
        </div>

        {/* Search & Mobile Filter Trigger Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="साहित्य शोधा (उदा. MPSC, Polity, Maths)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-500"
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
              className="lg:hidden flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-800 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>फिल्टर्स {hasActiveFilters && '•'}</span>
            </button>
          </div>
        </div>

        {/* Layout: Desktop Sidebar (3 Cols) + Product Grid (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 space-y-6 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>{t.materials.filters}</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  {t.materials.clearAll}
                </button>
              )}
            </div>

            {/* Exam Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t.materials.filterExam}
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedExam('All')}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedExam === 'All'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>सर्व परीक्षा (All)</span>
                  <span className="text-[10px] opacity-70">{STUDY_MATERIALS_DATA.length}</span>
                </button>
                {EXAM_CATEGORIES_DATA.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExam(ex.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedExam === ex.id
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{ex.name[lang]}</span>
                    <span className="text-[10px] opacity-70">{ex.resourcesCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t.materials.filterSubject}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors border cursor-pointer ${
                      selectedSubject === sub
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Type Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t.materials.filterType}
              </span>
              <div className="space-y-1">
                {materialTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      selectedType === type
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
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
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600'
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
                <strong className="text-slate-900 font-bold">{filteredMaterials.length}</strong> अभ्यास साहित्य उपलब्ध
              </span>
              {hasActiveFilters && (
                <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">फिल्टर लागू आहेत</span>
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
              <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
                <BookOpen className="w-12 h-12 text-blue-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-900">
                  कोणतेही अभ्यास साहित्य सापडले नाही
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  तुमच्या निवडलेल्या निकषांशी जुळणारे साहित्य उपलब्ध नाही. कृपया इतर फिल्टर्स निवडून पहा.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
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
