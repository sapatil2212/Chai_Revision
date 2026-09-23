'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { X, Lock, ChevronLeft, ChevronRight, BookOpen, ShieldAlert, ShoppingCart } from 'lucide-react';

export function PdfPreviewModal() {
  const { previewProduct, setPreviewProduct, addToCart, navigateTo, lang } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const totalSamplePages = 5;

  if (!previewProduct) return null;

  const handleBuyNow = () => {
    addToCart(previewProduct);
    setPreviewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[750px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold truncate text-slate-900">
                {previewProduct.title[lang]} — नमुना पृष्ठे (Sample Preview)
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{previewProduct.pages} एकूण पृष्ठे</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{previewProduct.exam} स्पेशल</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBuyNow}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>खरेदी करा (₹{previewProduct.discountedPrice})</span>
            </button>
            <button
              onClick={() => setPreviewProduct(null)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Center Canvas with Sample Page Simulation */}
        <div className="flex-1 bg-slate-100/90 p-4 sm:p-8 flex items-center justify-center overflow-y-auto relative select-none">
          {/* Simulated Digital Watermarked Page Sheet */}
          <div className="w-full max-w-lg aspect-[1/1.414] bg-white text-slate-900 rounded-xl shadow-md p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border border-slate-200/90">
            {/* Diagonal Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 rotate-[-35deg] text-3xl font-black tracking-widest text-slate-900">
              CHAI REVISION • SAMPLE PREVIEW • CHAI REVISION
            </div>

            {/* Page Header */}
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
              <span>{previewProduct.exam} MASTER REVISION NOTES</span>
              <span>CHAI REVISION ACADEMY</span>
            </div>

            {/* Page Body Content simulation based on page number */}
            <div className="my-auto space-y-3 text-xs leading-relaxed text-slate-800">
              {currentPage === 1 && (
                <>
                  <div className="text-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">अनुक्रमणिका (Table of Contents)</span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">{previewProduct.title.mr}</h4>
                  </div>
                  <ul className="space-y-1.5 text-[11px]">
                    {previewProduct.tableOfContents.slice(0, 5).map((ch, i) => (
                      <li key={i} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                        <span className="font-medium truncate">{ch}</span>
                        <span className="font-bold text-slate-400 shrink-0 ml-2">पृष्ठ {i * 18 + 1}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {currentPage === 2 && (
                <>
                  <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                    <h5 className="font-bold text-xs text-blue-900">घटक १: ठळक परीक्षा मुद्दे (High Yield Points)</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      परीक्षेत विचारण्यात येणारे थेट तथ्यात्मक प्रश्न व तुलनात्मक सारणी:
                    </p>
                  </div>
                  <div className="border border-slate-200 rounded-md overflow-hidden text-[10px]">
                    <div className="bg-slate-50 p-1.5 font-bold border-b border-slate-200 flex justify-between">
                      <span>कलम / कायदा</span>
                      <span>तरतूद व महत्त्व</span>
                    </div>
                    <div className="p-1.5 border-b border-slate-100 flex justify-between">
                      <span className="font-semibold text-blue-600">कलम १२-३५</span>
                      <span>मूलभूत हक्क (भाग ३) — अमेरिकेच्या संविधानातून प्रेरित</span>
                    </div>
                    <div className="p-1.5 border-b border-slate-100 flex justify-between">
                      <span className="font-semibold text-blue-600">कलम ३६-५१</span>
                      <span>मार्गदर्शक तत्त्वे (भाग ४) — आयर्लंडकडून स्वीकार</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    * टीप: MPSC प्रिलिम्समध्ये मागील ५ वर्षांत यावर किमान ४ प्रश्न विचारले गेले आहेत.
                  </p>
                </>
              )}

              {currentPage >= 3 && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">संपूर्ण पुस्तक अनलॉक करा</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    नमुना वाचन पृष्ठ मर्यादा समाप्त झाली आहे. उर्वरित {previewProduct.pages - 2} पृष्ठे वाचण्यासाठी आणि PDF डाउनलोड करण्यासाठी आता खरेदी करा.
                  </p>
                  <button
                    onClick={handleBuyNow}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs shadow-blue-500/20"
                  >
                    आता खरेदी करा — केवळ ₹{previewProduct.discountedPrice}
                  </button>
                </div>
              )}
            </div>

            {/* Page Footer */}
            <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] text-slate-400">
              <span>Chai Revision Digital Publishing</span>
              <span>पृष्ठ {currentPage} / {previewProduct.pages}</span>
            </div>
          </div>
        </div>

        {/* Reader Controls Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-700 font-semibold">
              नमुना पृष्ठ {currentPage} / {totalSamplePages}
            </span>
            <button
              disabled={currentPage >= totalSamplePages}
              onClick={() => setCurrentPage((p) => Math.min(totalSamplePages, p + 1))}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>सुरक्षित डिजिटल सामग्री • कॉपीराईट संरक्षित</span>
          </div>
        </div>
      </div>
    </div>
  );
}
