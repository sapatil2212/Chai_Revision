'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Upload, AlertTriangle } from 'lucide-react';
import { quizAdminApi, type AdminQuiz } from '@/lib/adminQuizApi';
import { Modal, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls } from '../ui';
import { useAdminDialog } from '@/components/admin/AdminDialogContext';

interface Props {
  quiz: AdminQuiz;
  onClose: () => void;
  onImported: (count: number) => void;
  onUnauthorized: () => void;
}

export function CsvImportModal({ quiz, onClose, onImported, onUnauthorized }: Props) {
  const dialog = useAdminDialog();
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rowErrors, setRowErrors] = useState<{ row: number; message: string }[]>([]);

  const rowCount = csv.trim() ? Math.max(0, csv.trim().split(/\r?\n/).length - 1) : 0;

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError('CSV file is too large (max 5 MB).');
    setError('');
    setRowErrors([]);
    setFileName(file.name);
    setCsv(await file.text());
  };

  const submit = async () => {
    setError('');
    setRowErrors([]);
    if (!csv.trim()) return setError('Choose a CSV file or paste CSV text.');
    if (mode === 'replace' && quiz.stats.questions > 0) {
      const ok = await dialog.confirm({
        title: 'Replace All Questions?',
        message: `This CSV upload will overwrite and replace all ${quiz.stats.questions} existing questions in "${quiz.title.en || quiz.title.mr}".`,
        note: 'Existing questions that are not in this CSV file will be permanently removed.',
        confirmText: 'Replace All Questions',
        variant: 'warning',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await quizAdminApi.importCsv(quiz.id, csv, mode);
      if (res.errors.length) {
        setRowErrors(res.errors);
        setError(`${res.errors.length} row(s) need fixing. Nothing was imported.`);
      } else {
        onImported(res.inserted);
      }
    } catch (err) {
      if (isUnauthorized(err)) return onUnauthorized();
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      labelledBy="csv-import-title"
      onClose={onClose}
      title={
        <>
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" aria-hidden="true" /> Bulk import questions (CSV)
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <ol className="list-decimal pl-5 space-y-1 text-slate-600">
          <li>
            Download the template, fill one question per row in Excel / Google Sheets (Marathi and/or English).
          </li>
          <li>
            <code className="font-mono">correct_option</code> is A, B, C or D. Empty marks use the quiz defaults ({quiz.defaultMarks} / −{quiz.defaultNegativeMarks}).
          </li>
          <li>Save as CSV (UTF-8) and upload it here.</li>
        </ol>
        <a href={quizAdminApi.templateUrl} className={btnSecondary}>
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download template
        </a>

        <div className="flex flex-wrap items-center gap-3">
          <label className={`${btnSecondary} focus-within:ring-2 focus-within:ring-blue-300`}>
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{fileName || 'Choose CSV file'}</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={pickFile} />
          </label>
          {rowCount > 0 && <span className="text-slate-500">{rowCount} data row(s) detected</span>}
        </div>

        <div>
          <label htmlFor="csv-text" className={labelCls}>…or paste CSV text</label>
          <textarea
            id="csv-text"
            rows={5}
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              setFileName('');
            }}
            className={`${inputCls} font-mono text-[11px]`}
          />
        </div>

        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Import mode</legend>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={mode === 'append'} onChange={() => setMode('append')} /> Add to existing questions
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace all questions
          </label>
        </fieldset>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 space-y-2" role="alert">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" /> {error}
            </p>
            {rowErrors.length > 0 && (
              <ul className="max-h-40 overflow-y-auto space-y-0.5 font-mono text-[11px]">
                {rowErrors.slice(0, 100).map((r) => (
                  <li key={r.row}>
                    Row {r.row}: {r.message}
                  </li>
                ))}
                {rowErrors.length > 100 && <li>…and {rowErrors.length - 100} more</li>}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy || !csv.trim()} className={btnPrimary}>
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
            Import {rowCount ? `${rowCount} question(s)` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}
