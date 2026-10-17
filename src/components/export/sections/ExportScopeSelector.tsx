'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { VaultFile } from '@/src/lib/storage/db';
import { normalizeFolderPath } from '@/src/lib/export/exportBundleService';

export interface ExportScopeSelectorProps {
  scopeMode: 'single' | 'directory';
  setScopeMode: (mode: 'single' | 'directory') => void;
  activeNote: VaultFile | null;
  folderPath?: string;
}

/**
 * Renders the Export Scope selector (Current Note vs Folder / Entire Vault).
 */
export function ExportScopeSelector({
  scopeMode,
  setScopeMode,
  activeNote,
  folderPath,
}: ExportScopeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" /> Export Scope
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setScopeMode('single')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
            scopeMode === 'single'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
          }`}
        >
          <div className="font-semibold mb-0.5">Current Note</div>
          <div className="text-[11px] opacity-75 truncate">{activeNote?.title || 'Active Document'}</div>
        </button>
        <button
          type="button"
          onClick={() => setScopeMode('directory')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
            scopeMode === 'directory'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
          }`}
        >
          <div className="font-semibold mb-0.5">{folderPath ? 'Folder' : 'Entire Vault'}</div>
          <div className="text-[11px] opacity-75 truncate">
            {folderPath ? normalizeFolderPath(folderPath) : 'All IndexedDB Notes'}
          </div>
        </button>
      </div>
    </div>
  );
}
