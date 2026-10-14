'use client';

import React, { useState, useMemo } from 'react';
import { GitCompare, Check, RotateCcw, Save, Columns2, AlignJustify } from 'lucide-react';
import {
  computeDiffStats,
  computeUnifiedLines,
  computeSplitLines,
} from './diffUtils';

export interface DiffViewerProps {
  savedContent: string;
  unsavedContent: string;
  onSave?: () => void;
  onRevert?: () => void;
}

export function DiffViewer({
  savedContent,
  unsavedContent,
  onSave,
  onRevert,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const { changes, addedCount, removedCount, hasChanges } = useMemo(
    () => computeDiffStats(savedContent, unsavedContent),
    [savedContent, unsavedContent]
  );

  const unifiedLines = useMemo(() => computeUnifiedLines(changes), [changes]);
  const splitLines = useMemo(() => computeSplitLines(changes), [changes]);

  return (
    <div className="flex flex-col space-y-2 sm:space-y-4 bg-transparent">
      {/* Top Diff Micro-Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--card)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)]">
            <GitCompare className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Diff Viewer (Unsaved vs Saved)</span>
          </div>

          {/* Status Badge */}
          {hasChanges ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono text-amber-600 dark:text-amber-400">
              <span>{addedCount + removedCount} line(s) modified</span>
              <span className="text-neutral-400">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">+{addedCount}</span>
              <span className="text-rose-600 dark:text-rose-400">-{removedCount}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>No Unsaved Changes</span>
            </div>
          )}
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Unified vs Split Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                viewMode === 'unified'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Unified View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unified</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                viewMode === 'split'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Split (Side-by-Side) View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>

          {/* Action Buttons: Discard & Save */}
          {onRevert && (
            <button
              type="button"
              onClick={onRevert}
              disabled={!hasChanges}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-rose-600 hover:border-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Discard working changes and revert to saved note"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Discard</span>
            </button>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={!hasChanges}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer shadow-xs"
              title="Persist unsaved changes to disk and database"
            >
              <Save className="w-3 h-3" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Diff Display Container */}
      <div
        className="relative flex flex-col rounded-xl border border-[var(--border)] overflow-hidden shadow-2xs backdrop-blur-md h-[550px] sm:h-[680px] max-h-[calc(100vh-220px)] min-h-[350px] sm:min-h-[480px] bg-transparent"
      >
        {viewMode === 'unified' ? (
          /* Unified View */
          <div className="flex-1 overflow-auto font-mono text-[13px] leading-7 divide-y divide-[var(--border)]/30">
            {unifiedLines.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">Note is empty.</div>
            ) : (
              unifiedLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-start w-full whitespace-pre font-mono ${
                    line.type === 'added'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : line.type === 'removed'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'text-[var(--foreground)] hover:bg-[var(--card)]/40'
                  }`}
                >
                  <span className="w-10 sm:w-12 select-none py-0.5 text-right pr-2 text-neutral-400 border-r border-[var(--border)] shrink-0 text-[11px]">
                    {line.oldNum || ''}
                  </span>
                  <span className="w-10 sm:w-12 select-none py-0.5 text-right pr-2 text-neutral-400 border-r border-[var(--border)] shrink-0 text-[11px]">
                    {line.newNum || ''}
                  </span>
                  <span className="w-6 select-none py-0.5 text-center font-bold shrink-0">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span className="flex-1 py-0.5 pl-2 pr-4 overflow-x-auto select-text">
                    {line.text || '\u00A0'}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Split View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Split Headers */}
            <div
              className="grid grid-cols-2 border-b border-[var(--border)] text-[11px] font-mono text-neutral-400 shrink-0 select-none bg-[var(--bg-secondary)]/80 backdrop-blur-sm"
            >
              <div className="px-3 py-1.5 border-r border-[var(--border)] font-semibold flex items-center justify-between">
                <span>Saved Baseline</span>
                <span className="text-[10px] text-neutral-500">Persistent</span>
              </div>
              <div className="px-3 py-1.5 font-semibold flex items-center justify-between">
                <span>Working Copy</span>
                <span className="text-[10px] text-neutral-500">Unsaved</span>
              </div>
            </div>

            {/* Split Content Rows */}
            <div className="flex-1 overflow-auto font-mono text-[13px] leading-7 divide-y divide-[var(--border)]/30">
              {splitLines.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">Note is empty.</div>
              ) : (
                splitLines.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-2 divide-x divide-[var(--border)]">
                    {/* Left Pane (Saved) */}
                    <div
                      className={`flex items-start whitespace-pre overflow-hidden ${
                        row.left.type === 'removed'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          : row.left.type === 'empty'
                            ? 'bg-neutral-500/5'
                            : 'text-[var(--foreground)]'
                      }`}
                    >
                      <span className="w-10 sm:w-12 select-none py-0.5 text-right pr-2 text-neutral-400 border-r border-[var(--border)] shrink-0 text-[11px]">
                        {row.left.num || ''}
                      </span>
                      <span className="w-5 select-none py-0.5 text-center font-bold shrink-0">
                        {row.left.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className="flex-1 py-0.5 pl-1.5 pr-2 overflow-x-auto select-text">
                        {row.left.text || (row.left.type === 'empty' ? '' : '\u00A0')}
                      </span>
                    </div>

                    {/* Right Pane (Working Copy) */}
                    <div
                      className={`flex items-start whitespace-pre overflow-hidden ${
                        row.right.type === 'added'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : row.right.type === 'empty'
                            ? 'bg-neutral-500/5'
                            : 'text-[var(--foreground)]'
                      }`}
                    >
                      <span className="w-10 sm:w-12 select-none py-0.5 text-right pr-2 text-neutral-400 border-r border-[var(--border)] shrink-0 text-[11px]">
                        {row.right.num || ''}
                      </span>
                      <span className="w-5 select-none py-0.5 text-center font-bold shrink-0">
                        {row.right.type === 'added' ? '+' : ' '}
                      </span>
                      <span className="flex-1 py-0.5 pl-1.5 pr-2 overflow-x-auto select-text">
                        {row.right.text || (row.right.type === 'empty' ? '' : '\u00A0')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
