'use client';

import React, { useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import { pyqAdminApi } from '@/lib/adminPyqApi';
import { Modal, btnPrimary, btnSecondary, inputCls, isUnauthorized, labelCls } from '../ui';

interface Props {
  onClose: () => void;
  onImported: (count: number) => void;
  onUnauthorized: () => void;
}

export function PyqCsvImportModal({ onClose, onImported, onUnauthorized }: Props) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
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
    setBusy(true);
    try {
      const res = await pyqAdminApi.importCsv(csv);
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
      labelledBy="pyq-csv-title"
      onClose={onClose}
      title={
        <>
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" aria-hidden="true" /> Bulk import PYQs (CSV)
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <ol className="list-decimal pl-5 space-y-1 text-slate-600">
          <li>Download the template and fill one question per row in Excel / Google Sheets.</li>
          <li>
            <code className="font-mono">exam</code>, <code className="font-mono">year</code>, <code className="font-mono">subject</code> and{' '}
            <code className="font-mono">correct_option</code> are required on every row. Hindi columns are optional.
          </li>
          <li>
            <code className="font-mono">correct_option</code> accepts A–D or 1–4.
          </li>
          <li>Save as CSV (UTF-8) and upload it here. If any row is invalid, nothing is imported.</li>
        </ol>
        <a href={pyqAdminApi.templateUrl} className={btnSecondary}>
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
          <label htmlFor="pyq-csv-text" className={labelCls}>
            …or paste CSV text
          </label>
          <textarea
            id="pyq-csv-text"
            rows={5}
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              setFileName('');
            }}
            className={`${inputCls} font-mono text-[11px]`}
          />
        </div>

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
