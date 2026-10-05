'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/store';
import { Star, FileText, ShoppingCart, Eye, Bookmark, Download } from 'lucide-react';
import { SUBJECT_LABELS_MR } from '@/lib/adminOptions';
import { canDownloadFree, materialDownloadUrl } from '@/lib/materialLinks';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    lang,
    t,
    navigateTo,
    setPreviewProduct,
    toggleBookmark,
    isBookmarked,
  } = useApp();

  const bookmarked = isBookmarked(product.id);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewProduct(product);
  };

  // Go straight to the single-item checkout (no cart)
  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo('checkout', { slug: product.slug });
  };

  const handleCardClick = () => {
    navigateTo('materials', { slug: product.slug });
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xs hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group relative text-left"
    >
      <div>
        {/* Card Cover & Header */}
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
          <img
            src={product.coverImage}
            alt={product.title[lang]}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {/* Exam Category Chip & Badges - Subtle LMS styling */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            <span className="bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200/80 shadow-2xs">
              {product.exam}
            </span>
            {product.bestseller && (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200/80 shadow-2xs">
                Bestseller
              </span>
            )}
            {product.isFree && (
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/80 shadow-2xs">
                FREE
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(product.id);
            }}
            className="absolute top-2 right-2 w-6.5 h-6.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-400 hover:text-amber-500 flex items-center justify-center transition-colors shadow-2xs z-10 cursor-pointer"
            title="Bookmark"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          {/* Bottom Badges */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-medium text-slate-700 z-10">
            <span className="bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/80 shadow-2xs text-slate-600">
              <FileText className="w-2.5 h-2.5 text-slate-500" />
              {product.pages} {t.sections.pages}
            </span>
            <span className="bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs text-slate-600">
              {product.language}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-3.5 space-y-1.5 text-left">
          {/* Subject & Updated Date */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
              {lang === 'en' ? product.subject : SUBJECT_LABELS_MR[product.subject] || product.subject}
            </span>
            <span className="text-slate-400 shrink-0 font-normal">{product.lastUpdated}</span>
          </div>

          {/* Title */}
          <h3 className="font-medium text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-h-[36px]">
            {product.title[lang]}
          </h3>

          {/* Subtitle */}
          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 min-h-[16px]">
            {product.subtitle?.[lang] || product.materialType}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 pt-0.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-medium text-slate-700 text-[11px]">{product.rating}</span>
            <span className="text-[10px] text-slate-400 font-normal">({product.reviewsCount})</span>
          </div>
        </div>
      </div>

      {/* Footer Price & Action Buttons */}
      <div className="p-3.5 pt-0 space-y-2.5">
        <div className="flex items-baseline justify-between border-t border-slate-100 pt-2.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-semibold text-slate-900">
                {product.isFree ? 'मोफत' : `₹${product.discountedPrice}`}
              </span>
              {!product.isFree && product.originalPrice > product.discountedPrice && (
                <span className="text-[11px] text-slate-400 line-through font-normal">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {!product.isFree && product.originalPrice > product.discountedPrice && (
              <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded">
                {Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}% सूट
              </span>
            )}
          </div>

          {/* Sample PDF Preview Button */}
          <button
            onClick={handlePreview}
            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3 h-3 text-slate-500" />
            <span>{t.sections.previewPdf}</span>
          </button>
        </div>

        {/* CTA Buy Now / Add to Cart */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateTo('materials', { slug: product.slug });
            }}
            className="h-8 px-2.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80 rounded-xl transition-colors text-center inline-flex items-center justify-center cursor-pointer shadow-2xs"
          >
            तपशील
          </button>

          {product.isFree ? (
            canDownloadFree(product) ? (
              <a
                href={materialDownloadUrl(product.slug)}
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-2.5 text-xs font-medium rounded-xl transition-all inline-flex items-center justify-center gap-1.5 active:scale-98 shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-3 h-3" aria-hidden="true" />
                <span>डाउनलोड</span>
              </a>
            ) : (
              <span className="h-8 px-2.5 text-[10px] font-medium rounded-xl inline-flex items-center justify-center bg-slate-100 text-slate-500">
                लवकरच
              </span>
            )
          ) : (
          <button
            onClick={handleBuy}
            className="h-8 px-2.5 text-xs font-medium rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-2xs bg-slate-900 hover:bg-slate-800 text-white"
          >
            <ShoppingCart className="w-3 h-3" />
            <span>{t.sections.buyNow}</span>
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
