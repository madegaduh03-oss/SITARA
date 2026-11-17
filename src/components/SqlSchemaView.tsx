import React, { useState } from 'react';
import { Check, Copy, Database, FileCode2 } from 'lucide-react';
import { RAW_SQL_SCHEMA } from '../data/sqlSchema';

export const SqlSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(RAW_SQL_SCHEMA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([RAW_SQL_SCHEMA], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitara_schema.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Database className="w-4 h-4" />
            <span>Arsitektur Basis Data Backend</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Skema SQL & Prototipe HTML Utuh
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Struktur DDL untuk implementasi PostgreSQL / MySQL beserta unduhan berkas HTML tunggal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'SQL Disalin' : 'Salin SQL'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSql}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Unduh .SQL</span>
          </button>

          <a
            href="/sitara-standalone.html"
            download="sitara-v2.1-standalone.html"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
          >
            <FileCode2 className="w-4 h-4" />
            <span>Unduh 1-File HTML</span>
          </a>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
        <pre className="font-mono-tabular text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre">
          {RAW_SQL_SCHEMA}
        </pre>
      </div>
    </div>
  );
};
