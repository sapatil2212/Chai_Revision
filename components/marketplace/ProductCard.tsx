'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/store';
import { Star, FileText, ShoppingCart, Eye, Bookmark, Check, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    lang,
    t,
    navigateTo,
    addToCart,
    cart,
    setPreviewProduct,
    toggleBookmark,
    isBookmarked,
  } = useApp();

  const inCart = cart.some((item) => item.id === product.id);
  const bookmarked = isBookmarked(product.id);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewProduct(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleCardClick = () => {
    navigateTo('materials', { slug: product.slug });
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group relative"
    >
      <div>
        {/* Card Cover & Header */}
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
          <img
            src={product.coverImage}
            alt={product.title[lang]}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />

          {/* Exam Category Chip & Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
              {product.exam}
            </span>
            {product.bestseller && (
              <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                Bestseller
              </span>
            )}
            {product.isFree && (
              <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
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
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-500 hover:text-amber-500 flex items-center justify-center transition-colors shadow-2xs z-10 cursor-pointer"
            title="Bookmark"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          {/* Bottom Badges */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-slate-700 z-10">
            <span className="bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200/80 shadow-2xs">
              <FileText className="w-3 h-3 text-blue-600" />
              {product.pages} {t.sections.pages}
            </span>
            <span className="bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs text-slate-600">
              {product.language}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-2 text-left">
          {/* Subject & Updated Date */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full truncate max-w-[160px]">
              {product.subject}
            </span>
            <span className="text-slate-400 shrink-0 font-normal">{product.lastUpdated}</span>
          </div>

          {/* Title - Soft slate-800 */}
          <h3 className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug min-h-[42px]">
            {product.title[lang]}
          </h3>

          {/* Subtitle - Soft slate-500 */}
          <p className="text-xs text-slate-500 font-normal line-clamp-1 min-h-[18px]">
            {product.subtitle ? product.subtitle[lang] : 'सर्वसमावेशक अभ्यास घटक'}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 pt-0.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-semibold text-slate-800">{product.rating}</span>
            <span className="text-[11px] text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>
      </div>

      {/* Footer Price & Action Buttons */}
      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-blue-700">
                {product.isFree ? 'मोफत' : `₹${product.discountedPrice}`}
              </span>
              {!product.isFree && product.originalPrice > product.discountedPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {!product.isFree && product.originalPrice > product.discountedPrice && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded-full">
                {Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}% सूट
              </span>
            )}
          </div>

          {/* Sample PDF Preview Button */}
          <button
            onClick={handlePreview}
            className="text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
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
            className="h-9 px-3 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-full transition-colors text-center inline-flex items-center justify-center cursor-pointer"
          >
            तपशील
          </button>

          <button
            onClick={handleAddToCart}
            className={`h-9 px-3 text-xs font-semibold rounded-full transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-2xs ${
              inCart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/15'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.sections.addedToCart}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{product.isFree ? 'डाउनलोड' : t.sections.buyNow}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
