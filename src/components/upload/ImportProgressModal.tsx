'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { CheckCircle2, AlertTriangle, FileText, Loader2, X } from 'lucide-react';

export function ImportProgressModal() {
  const { importProgress, setImportProgress } = useWorkspaceStore();

  if (!importProgress) return null;

  const total = Math.max(importProgress.scanned, 1);
  const completed = importProgress.parsed + importProgress.skipped;
  const percent = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {importProgress.isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            )}
            <h3 className="text-base font-semibold">
              {importProgress.isComplete ? 'Import Complete' : 'Ingesting Knowledge Vault...'}
            </h3>
          </div>
          {importProgress.isComplete && (
            <button
              onClick={() => setImportProgress(null)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-500 mb-1">
              <span>{importProgress.isComplete ? 'Indexed all files' : `Processing (${completed}/${total})`}</span>
              <span className="tabular-nums font-mono">{percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Current File Notice */}
          {!importProgress.isComplete && importProgress.currentFileName && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 truncate">
              <FileText className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
              <span className="truncate font-mono">{importProgress.currentFileName}</span>
            </div>
          )}

          {/* Metric Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 text-center">
            <div>
              <div className="text-xs text-neutral-500">Scanned</div>
              <div className="text-sm font-semibold font-mono tabular-nums">{importProgress.scanned}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Indexed</div>
              <div className="text-sm font-semibold text-emerald-600 font-mono tabular-nums">{importProgress.indexed}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Skipped</div>
              <div className="text-sm font-semibold text-neutral-500 font-mono tabular-nums">{importProgress.skipped}</div>
            </div>
          </div>

          {/* Error List */}
          {importProgress.errors.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 max-h-24 overflow-y-auto space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Encountered {importProgress.errors.length} unparseable files</span>
              </div>
              {importProgress.errors.map((err, i) => (
                <div key={i} className="truncate font-mono opacity-80">
                  {err}
                </div>
              ))}
            </div>
          )}

          {importProgress.isComplete && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setImportProgress(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
