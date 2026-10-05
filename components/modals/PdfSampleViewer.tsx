'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export type SampleState =
  | { status: 'loading' }
  | { status: 'ready'; previewPages: number; totalPages: number }
  | { status: 'unavailable' };

interface Props {
  slug: string;
  title: string;
  /** Reports load result so the parent can show page counts / fallbacks. */
  onState: (state: SampleState) => void;
}

/**
 * Renders the auto-generated sample PDF (first few pages only) onto canvases with pdf.js.
 * The server never sends the full document to this component.
 */
export function PdfSampleViewer({ slug, title, onState }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<SampleState['status']>('loading');
  const onStateRef = useRef(onState);
  useEffect(() => {
    onStateRef.current = onState;
  }, [onState]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;

    (async () => {
      try {
        const res = await fetch(`/api/materials/${encodeURIComponent(slug)}/preview`);
        if (!res.ok) throw new Error('unavailable');
        const previewPages = Number(res.headers.get('X-Preview-Pages')) || 0;
        const totalPages = Number(res.headers.get('X-Total-Pages')) || 0;
        const data = new Uint8Array(await res.arrayBuffer());

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const task = pdfjs.getDocument({
          data,
          isEvalSupported: false,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
        });
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) return;

        setPageCount(doc.numPages);
        setStatus('ready');
        onStateRef.current({ status: 'ready', previewPages: previewPages || doc.numPages, totalPages });

        // Wait until React has rendered a canvas for every page
        for (let tries = 0; tries < 60; tries++) {
          if (cancelled) return;
          if ((containerRef.current?.querySelectorAll('canvas[data-page]').length ?? 0) >= doc.numPages) break;
          await new Promise((r) => requestAnimationFrame(() => r(null)));
        }
        const container = containerRef.current;
        if (!container) return;
        const cssWidth = Math.min(container.clientWidth, 720);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
          const canvas = container.querySelector<HTMLCanvasElement>(`canvas[data-page="${i}"]`);
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${viewport.height / dpr}px`;
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch {
        if (cancelled) return;
        setStatus('unavailable');
        onStateRef.current({ status: 'unavailable' });
      }
    })();

    return () => {
      cancelled = true;
      void loadingTask?.destroy().catch(() => {});
    };
  }, [slug]);

  if (status === 'unavailable') return null;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-4">
      {status === 'loading' && (
        <div className="w-full max-w-[720px] aspect-[1/1.414] bg-white rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-500" role="status">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
          नमुना पृष्ठे लोड होत आहेत…
        </div>
      )}
      {Array.from({ length: pageCount }, (_, idx) => (
        <div key={idx} className="relative bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none">
          <canvas
            data-page={idx + 1}
            role="img"
            aria-label={`${title} — sample page ${idx + 1}`}
            onContextMenu={(e) => e.preventDefault()}
            className="block max-w-full h-auto"
          />
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.07] rotate-[-35deg] text-2xl sm:text-3xl font-black tracking-widest text-slate-900">
            CHAI REVISION • SAMPLE
          </div>
          <span className="absolute bottom-2 right-3 text-[10px] font-semibold bg-white/90 text-slate-500 px-1.5 py-0.5 rounded">
            पृष्ठ {idx + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
