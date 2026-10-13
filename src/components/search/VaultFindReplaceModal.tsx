'use client';

import React, { useEffect, useRef } from 'react';
import { useFindReplaceStore } from '@/src/stores/findReplaceStore';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { VaultMatchFileRow } from './VaultMatchFileRow';
import {
  Search,
  Replace,
  X,
  RotateCcw,
  CheckCheck,
  ChevronRight,
  Loader2,
  Folder,
} from 'lucide-react';

export function VaultFindReplaceModal() {
  const {
    isOpen,
    setOpen,
    query,
    replacement,
    isRegex,
    matchCase,
    wholeWord,
    scopeFolder,
    results,
    isSearching,
    lastSnapshot,
    setSearchParams,
    toggleFileChecked,
    setAllChecked,
    replaceInCheckedFiles,
    replaceAll,
    replaceNextMatch,
    undoLastBatch,
  } = useFindReplaceStore();

  const { showToast, openFileTab } = useWorkspaceStore();
  const queryInputRef = useRef<HTMLInputElement>(null);

  // Global Hotkey (Cmd+Shift+H / Ctrl+Shift+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!isOpen);
      } else if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => queryInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);
  const checkedCount = results.filter((r) => r.checked && r.matches.length > 0).length;
  const allChecked = results.length > 0 && results.every((r) => r.checked);

  const handleReplaceChecked = async () => {
    const modified = await replaceInCheckedFiles();
    showToast(`Replaced in ${modified} file${modified === 1 ? '' : 's'}`);
  };

  const handleReplaceAll = async () => {
    const modified = await replaceAll();
    showToast(`Replaced all in ${modified} file${modified === 1 ? '' : 's'}`);
  };

  const handleReplaceNext = async () => {
    const ok = await replaceNextMatch();
    if (ok) {
      showToast('Replaced next match');
    } else {
      showToast('No further matches to replace');
    }
  };

  const handleUndo = async () => {
    await undoLastBatch();
    showToast('Reverted previous batch replacement');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-[var(--foreground)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Replace className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold">Vault RegEx Find & Replace</h2>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)] text-neutral-400">
              ⌘⇧H
            </kbd>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs section */}
        <div className="p-4 border-b border-[var(--border)] space-y-2.5 bg-[var(--background)]/50 text-xs">
          {/* Find Query Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                ref={queryInputRef}
                type="text"
                value={query}
                onChange={(e) => setSearchParams({ query: e.target.value })}
                placeholder="Find in vault..."
                className="w-full pl-8 pr-28 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
              />
              {/* Option toggles */}
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setSearchParams({ matchCase: !matchCase })}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    matchCase
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800'
                  }`}
                  title="Match Case (Aa)"
                >
                  Aa
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ wholeWord: !wholeWord })}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    wholeWord
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800'
                  }`}
                  title="Whole Word (\b)"
                >
                  \b
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ isRegex: !isRegex })}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    isRegex
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800'
                  }`}
                  title="Regular Expression (.*)"
                >
                  .*
                </button>
              </div>
            </div>
          </div>

          {/* Replacement Input Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Replace className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={replacement}
                onChange={(e) => setSearchParams({ replacement: e.target.value })}
                placeholder="Replace with ($1, $2 supported)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            {scopeFolder && (
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono">
                <Folder className="w-3 h-3" />
                {scopeFolder}
              </span>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] text-xs">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => setAllChecked(e.target.checked)}
                className="rounded accent-[var(--accent)] cursor-pointer"
              />
              <span className="text-[11px]">Select All</span>
            </label>
            <span className="text-[11px] text-neutral-500 font-mono">
              {isSearching ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Scanning...
                </span>
              ) : (
                `${totalMatches} matches in ${results.length} files`
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleReplaceNext}
              disabled={totalMatches === 0}
              className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-neutral-800 text-[11px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Replace next occurrence sequentially"
            >
              Replace Next
            </button>
            <button
              type="button"
              onClick={handleReplaceChecked}
              disabled={checkedCount === 0}
              className="px-2.5 py-1 rounded-md bg-[var(--accent)] hover:opacity-90 text-white text-[11px] font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Replace matches across checked files"
            >
              Replace Checked ({checkedCount})
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={totalMatches === 0}
              className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-neutral-800 text-[11px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Replace all matches across vault"
            >
              Replace All
            </button>
            {lastSnapshot && (
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[11px] border border-amber-500/30 transition-colors cursor-pointer"
                title="Roll back previous batch replace"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500 text-xs">
              {query ? (
                <>
                  <Search className="w-8 h-8 text-neutral-600 mb-2" />
                  <p>No matches found in vault</p>
                </>
              ) : (
                <>
                  <Replace className="w-8 h-8 text-neutral-600 mb-2" />
                  <p>Type a search query above to scan vault</p>
                </>
              )}
            </div>
          ) : (
            results.map((group) => (
              <VaultMatchFileRow
                key={group.noteId}
                group={group}
                onToggleCheck={toggleFileChecked}
                onOpenFile={(path) => {
                  openFileTab(path);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
