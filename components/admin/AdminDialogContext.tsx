'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'error';

export interface ConfirmOptions {
  title: string;
  message: string | React.ReactNode;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  note?: string;
  icon?: React.ReactNode;
}

export interface AlertPopupOptions {
  title: string;
  message: string | React.ReactNode;
  variant?: DialogVariant;
  buttonText?: string;
  note?: string;
}

export interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface AdminDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertPopupOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  toast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

const AdminDialogContext = createContext<AdminDialogContextType | null>(null);

export function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  // Confirm state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  // Alert state
  const [alertState, setAlertState] = useState<{
    open: boolean;
    options: AlertPopupOptions;
    resolve: () => void;
  } | null>(null);

  // Prompt state
  const [promptState, setPromptState] = useState<{
    open: boolean;
    options: PromptOptions;
    value: string;
    resolve: (value: string | null) => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Confirm method
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        options,
        resolve: (val: boolean) => {
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  }, []);

  // Alert method
  const alert = useCallback((options: AlertPopupOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        open: true,
        options,
        resolve: () => {
          setAlertState(null);
          resolve();
        },
      });
    });
  }, []);

  // Prompt method
  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        open: true,
        options,
        value: options.defaultValue || '',
        resolve: (val: string | null) => {
          setPromptState(null);
          resolve(val);
        },
      });
    });
  }, []);

  // Toast method
  const toast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AdminDialogContext.Provider value={{ confirm, alert, prompt, toast }}>
      {children}

      {/* CONFIRM MODAL */}
      {confirmState?.open && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
            {/* Header Icon */}
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs border ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                    : confirmState.options.variant === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {confirmState.options.icon || (
                  confirmState.options.variant === 'danger' ? (
                    <Trash2 className="w-5 h-5" />
                  ) : confirmState.options.variant === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : confirmState.options.variant === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )
                )}
              </div>

              <button
                onClick={() => confirmState.resolve(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Message */}
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {confirmState.options.title}
            </h3>
            <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1.5">
              {confirmState.options.message}
            </div>

            {/* Optional Callout Note */}
            {confirmState.options.note && (
              <div
                className={`mt-3.5 p-3 rounded-xl text-xs font-normal border leading-relaxed ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-50/70 border-rose-200/80 text-rose-800'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {confirmState.options.note}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="flex-1 h-9.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer text-center inline-flex items-center justify-center"
              >
                {confirmState.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => confirmState.resolve(true)}
                className={`flex-1 h-9.5 px-4 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : confirmState.options.variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {confirmState.options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {alertState?.open && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
            {/* Header Icon */}
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs border ${
                  alertState.options.variant === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                    : alertState.options.variant === 'error'
                    ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                    : alertState.options.variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {alertState.options.variant === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : alertState.options.variant === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : alertState.options.variant === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <button
                onClick={() => alertState.resolve()}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Message */}
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {alertState.options.title}
            </h3>
            <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1.5">
              {alertState.options.message}
            </div>

            {alertState.options.note && (
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-normal">
                {alertState.options.note}
              </div>
            )}

            {/* Done Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => alertState.resolve()}
                className="w-full h-9.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center"
              >
                {alertState.options.buttonText || 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptState?.open && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shadow-2xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <button
                onClick={() => promptState.resolve(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {promptState.options.title}
            </h3>
            {promptState.options.message && (
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1">
                {promptState.options.message}
              </p>
            )}

            <div className="mt-4">
              <input
                type="text"
                autoFocus
                value={promptState.value}
                onChange={(e) =>
                  setPromptState((prev) => (prev ? { ...prev, value: e.target.value } : null))
                }
                placeholder={promptState.options.placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') promptState.resolve(promptState.value);
                  if (e.key === 'Escape') promptState.resolve(null);
                }}
              />
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => promptState.resolve(null)}
                className="flex-1 h-9.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer text-center inline-flex items-center justify-center"
              >
                {promptState.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => promptState.resolve(promptState.value)}
                className="flex-1 h-9.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center"
              >
                {promptState.options.confirmText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CONTAINER (Top Right) */}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-lg flex items-center justify-between gap-3 text-left transition-all animate-in slide-in-from-top-2 duration-200 ${
              t.type === 'success'
                ? 'bg-white text-slate-900 border-emerald-200/90 shadow-emerald-500/5'
                : t.type === 'error'
                ? 'bg-white text-slate-900 border-rose-200/90 shadow-rose-500/5'
                : t.type === 'warning'
                ? 'bg-white text-slate-900 border-amber-200/90 shadow-amber-500/5'
                : 'bg-white text-slate-900 border-slate-200/90 shadow-slate-500/5'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  t.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : t.type === 'error'
                    ? 'bg-rose-50 text-rose-600'
                    : t.type === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : t.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <p className="text-xs font-medium text-slate-800 leading-snug truncate">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AdminDialogContext.Provider>
  );
}

export function useAdminDialog() {
  const ctx = useContext(AdminDialogContext);
  if (!ctx) {
    throw new Error('useAdminDialog must be used within an AdminDialogProvider');
  }
  return ctx;
}
