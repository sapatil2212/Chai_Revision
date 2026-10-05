'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import type { Product } from '@/lib/types';
import { canDownloadFree, materialDownloadUrl } from '@/lib/materialLinks';
import { X, Lock, BookOpen, ShieldAlert, ShoppingCart, Download, Eye } from 'lucide-react';
import { PdfSampleViewer, type SampleState } from './PdfSampleViewer';

export function PdfPreviewModal() {
  const { previewProduct, setPreviewProduct } = useApp();
  if (!previewProduct) return null;
  // Keyed by product so state resets when a different material is previewed
  return <PreviewDialog key={previewProduct.id} product={previewProduct} onClose={() => setPreviewProduct(null)} />;
}

function PreviewDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const { navigateTo, lang } = useApp();
  const [sample, setSample] = useState<SampleState>(product.hasFile ? { status: 'loading' } : { status: 'unavailable' });
  const handleSampleState = useCallback((s: SampleState) => setSample(s), []);

  const freeDownload = canDownloadFree(product);
  const totalPages = (sample.status === 'ready' && sample.totalPages) || product.pages;
  const previewPages = sample.status === 'ready' ? sample.previewPages : 0;
  const remaining = Math.max(0, totalPages - previewPages);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // keep the page behind from scrolling
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleBuyNow = () => {
    onClose();
    navigateTo('checkout', { slug: product.slug });
  };

  const headerAction = freeDownload ? (
    <a href={materialDownloadUrl(product.slug)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
      <Download className="w-3.5 h-3.5" aria-hidden="true" />
      <span>मोफत डाऊनलोड</span>
    </a>
  ) : !product.isFree ? (
    <button onClick={handleBuyNow} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs shadow-blue-500/20">
      <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
      <span>खरेदी करा (₹{product.discountedPrice})</span>
    </button>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h3 id="preview-title" className="text-xs sm:text-sm font-bold truncate text-slate-900">
                {product.title[lang]} — नमुना पृष्ठे (Sample Preview)
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                <span>{totalPages} एकूण पृष्ठे</span>
                <span aria-hidden="true">•</span>
                <span className="text-blue-600 font-semibold">{product.exam}</span>
                {product.fileSize && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{product.fileSize}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900" aria-label="Close preview">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable reader */}
        <div className="flex-1 overflow-y-auto bg-slate-100/90 px-3 sm:px-8 py-5 space-y-4">
          {sample.status === 'ready' && previewPages > 0 && (
            <p className="text-center text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full w-fit mx-auto px-3 py-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              पहिली {previewPages} पृष्ठे मोफत नमुना — पुढे वाचण्यासाठी खाली स्क्रोल करा
            </p>
          )}

          {product.hasFile && <PdfSampleViewer slug={product.slug} title={product.title[lang]} onState={handleSampleState} />}

          {/* Fallback when there's no PDF preview: cover + contents */}
          {sample.status === 'unavailable' && (
            <div className="max-w-[720px] mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-5 sm:p-8 grid sm:grid-cols-[160px_1fr] gap-6">
              <img src={product.coverImage} alt={product.title[lang]} className="w-40 aspect-[3/4] object-cover rounded-lg border border-slate-200 mx-auto" />
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">अनुक्रमणिका (Table of Contents)</span>
                {product.tableOfContents.length ? (
                  <ol className="mt-2 space-y-1.5 text-xs">
                    {product.tableOfContents.map((ch, i) => (
                      <li key={i} className="flex gap-2 py-1 border-b border-dashed border-slate-200">
                        <span className="font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{product.description[lang]}</p>
                )}
              </div>
            </div>
          )}

          {/* Paywall — reached after scrolling past the sample pages */}
          {sample.status !== 'loading' && (
            <section aria-labelledby="paywall-title" className="relative max-w-[720px] mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
              {/* Blurred stand-in for the next page */}
              <div className="p-8 space-y-3 blur-[3px] opacity-60 select-none" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i} className="h-2.5 rounded bg-slate-200" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/85 to-white flex items-center justify-center p-6">
                <div className="text-center space-y-3 max-w-sm">
                  {freeDownload ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                        <Download className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <h4 id="paywall-title" className="font-bold text-base text-slate-900">संपूर्ण PDF मोफत डाऊनलोड करा</h4>
                      <p className="text-xs text-slate-500">सर्व {totalPages} पृष्ठे विनामूल्य उपलब्ध आहेत.</p>
                      <a href={materialDownloadUrl(product.slug)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md">
                        <Download className="w-4 h-4" aria-hidden="true" /> मोफत डाऊनलोड करा
                      </a>
                    </>
                  ) : product.isFree ? (
                    <>
                      <h4 id="paywall-title" className="font-bold text-base text-slate-900">PDF लवकरच उपलब्ध होईल</h4>
                      <p className="text-xs text-slate-500">हे साहित्य मोफत आहे; फाइल अपलोड होताच डाऊनलोड सुरू होईल.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                        <Lock className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <h4 id="paywall-title" className="font-bold text-base text-slate-900">पुढील पृष्ठे वाचण्यासाठी पेमेंट आवश्यक</h4>
                      <p className="text-xs text-slate-500">
                        {remaining > 0 ? `उर्वरित ${remaining} पृष्ठे` : 'संपूर्ण पुस्तक'} वाचण्यासाठी आणि PDF डाउनलोड करण्यासाठी खरेदी करा.
                      </p>
                      <button onClick={handleBuyNow} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer">
                        <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                        आता खरेदी करा — ₹{product.discountedPrice}
                        {product.originalPrice > product.discountedPrice && (
                          <span className="text-xs font-normal line-through opacity-75">₹{product.originalPrice}</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>सुरक्षित डिजिटल सामग्री • कॉपीराईट संरक्षित</span>
        </div>
      </div>
    </div>
  );
}
