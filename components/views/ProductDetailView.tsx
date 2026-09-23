'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { STUDY_MATERIALS_DATA } from '@/lib/data';
import { ProductCard } from '@/components/marketplace/ProductCard';
import {
  Star,
  FileText,
  Calendar,
  Eye,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  Bookmark,
  Share2,
  ArrowLeft,
  Download,
  Lock,
  BookOpen,
} from 'lucide-react';

export function ProductDetailView() {
  const {
    viewParams,
    navigateTo,
    lang,
    t,
    addToCart,
    cart,
    setPreviewProduct,
    toggleBookmark,
    isBookmarked,
  } = useApp();

  const slug = viewParams.slug || 'mpsc-polity-revision-notes';
  const product = STUDY_MATERIALS_DATA.find((p) => p.slug === slug) || STUDY_MATERIALS_DATA[0];

  const inCart = cart.some((p) => p.id === product.id);
  const bookmarked = isBookmarked(product.id);
  const [copied, setCopied] = useState(false);

  const relatedProducts = STUDY_MATERIALS_DATA.filter(
    (p) => p.id !== product.id && (p.exam === product.exam || p.subject === product.subject)
  ).slice(0, 3);

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('materials')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.materials.backToList}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleBookmark(product.id)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs"
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copied && (
              <span className="text-xs text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                लिंक कॉपी केली!
              </span>
            )}
          </div>
        </div>

        {/* Main Product Showcase Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Cover Preview (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative aspect-[1/1.35] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-md group">
                <img
                  src={product.coverImage}
                  alt={product.title[lang]}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                    {product.exam}
                  </span>
                  {product.bestseller && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                      Bestseller
                    </span>
                  )}
                </div>
              </div>

              {/* Sample PDF Preview Button */}
              <button
                onClick={() => setPreviewProduct(product)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>{t.sections.previewPdf} (नमुना पृष्ठे पाहा)</span>
              </button>

              <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 flex items-center gap-2 border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>सुरक्षित डिजिटल सामग्री • वॉटरमार्क संरक्षित</span>
              </div>
            </div>

            {/* Right Product Information (8 Cols) */}
            <div className="lg:col-span-8 space-y-5 text-left">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                  <span>{product.exam}</span>
                  <span>•</span>
                  <span>{product.subject}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-semibold">{product.materialType}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 leading-snug">
                  {product.title[lang]}
                </h1>

                {product.subtitle && (
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    {product.subtitle[lang]}
                  </p>
                )}

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-900">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <span>{product.rating}</span>
                  <span className="text-slate-500 font-normal">
                    ({product.reviewsCount} विद्यार्थी रेटिंग)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    शेवटचे अपडेट: {product.lastUpdated}
                  </span>
                </div>
              </div>

              {/* Price Callout */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {product.isFree ? 'मोफत' : `₹${product.discountedPrice}`}
                    </span>
                    {!product.isFree && product.originalPrice > product.discountedPrice && (
                      <span className="text-base text-slate-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                    {!product.isFree && product.originalPrice > product.discountedPrice && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}% सूट
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    एका वेळी पेमेंट • कायमस्वरूपी व्हॅलिडिटी (Lifetime Access)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    className={`px-6 py-3 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
                      inCart
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-white" />
                    <span>{inCart ? 'कार्ट मध्ये जोडले आहे' : product.isFree ? 'विनामूल्य मिळवा' : 'आता खरेदी करा (Buy Now)'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">पृष्ठ संख्या</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{product.pages} पृष्ठे</span>
                </div>
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">माध्यम / भाषा</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{product.language}</span>
                </div>
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">फॉरमॅट</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">Searchable PDF</span>
                </div>
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">अॅक्सेस</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">Instant Download</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  साहित्याचे तपशील (Product Description)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description[lang]}
                </p>
              </div>

              {/* Table of Contents */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>अनुक्रमणिका (Table of Contents)</span>
                </h3>
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200 text-xs">
                  {product.tableOfContents.map((chapter, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{chapter}</span>
                      <span className="text-slate-500 font-mono text-[11px]">घटक {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              संबंधित अभ्यास साहित्य (Related Materials)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
