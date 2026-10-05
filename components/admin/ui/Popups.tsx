'use client';

import React from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { DialogVariant } from '../AdminDialogContext';

export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  message?: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName,
  message,
  warningText = 'This action is permanent and cannot be undone.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  loading = false,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-2xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1.5">
          {message || (itemName ? `Are you sure you want to permanently delete "${itemName}"?` : 'Are you sure you want to proceed with deletion?')}
        </p>

        {/* Warning Callout */}
        {warningText && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-800 font-normal leading-relaxed">
            {warningText}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer text-center inline-flex items-center justify-center disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-9.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ActionConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | React.ReactNode;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  note?: string;
  loading?: boolean;
}

export function ActionConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'warning',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  note,
  loading = false,
}: ActionConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs border ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                : variant === 'warning'
                ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                : variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
          {title}
        </h3>
        <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1.5">
          {message}
        </div>

        {note && (
          <div
            className={`mt-3.5 p-3 rounded-xl text-xs font-normal border leading-relaxed ${
              variant === 'danger'
                ? 'bg-rose-50/70 border-rose-200/80 text-rose-800'
                : variant === 'warning'
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {note}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer text-center inline-flex items-center justify-center disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-9.5 px-4 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
}

export function FeedbackModal({
  open,
  onClose,
  title,
  message,
  variant = 'success',
  buttonText = 'Close',
}: FeedbackModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 max-w-md w-full animate-in zoom-in-95 duration-150 text-left">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs border ${
              variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                : variant === 'error'
                ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                : variant === 'warning'
                ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {variant === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : variant === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : variant === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
          {title}
        </h3>
        <div className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-1.5">
          {message}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="w-full h-9.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center inline-flex items-center justify-center"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
