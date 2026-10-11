'use client';

import React, { useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Cloud, Check, RefreshCw, BookOpen } from 'lucide-react';
import { useSyncProgress } from '@/src/lib/sync/syncProgress';

export interface EditorStatusMetricsProps {
  editor: Editor | null;
  isSaving?: boolean;
}

/**
 * EditorStatusMetrics
 * Displays live document statistics (word count, character count, estimated reading time)
 * alongside real-time autosave and Google Drive cloud sync status indicators.
 */
export function EditorStatusMetrics({
  editor,
  isSaving = false,
}: EditorStatusMetricsProps) {
  const syncProgress = useSyncProgress();

  const { wordCount, charCount, readingTimeMinutes } = useMemo(() => {
    if (!editor) {
      return { wordCount: 0, charCount: 0, readingTimeMinutes: 0 };
    }
    const text = editor.getText() || '';
    const trimmed = text.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    return {
      wordCount: words,
      charCount: text.length,
      readingTimeMinutes: words > 0 ? readingTime : 0,
    };
  }, [editor]);

  const isSyncActive =
    syncProgress.status === 'scanning' || syncProgress.status === 'syncing';

  return (
    <div
      role="status"
      aria-label="Editor Document Metrics and Sync Status"
      className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-[var(--background)]/60 border border-[var(--border)]/60 text-[10px] text-neutral-400 select-none shrink-0"
    >
      {/* Word Count Metric */}
      <div
        className="flex items-center gap-1 font-mono"
        title={`${wordCount} total words written in note`}
      >
        <span className="font-medium text-[var(--foreground)]/80">{wordCount}</span>
        <span>words</span>
      </div>

      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />

      {/* Character Count Metric */}
      <div
        className="flex items-center gap-1 font-mono hidden sm:flex"
        title={`${charCount} raw characters`}
      >
        <span>{charCount} chars</span>
      </div>

      {readingTimeMinutes > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden md:inline-block" />
          <div
            className="flex items-center gap-1 font-mono hidden md:flex text-neutral-400"
            title="Estimated reading duration at 200 wpm"
          >
            <BookOpen className="w-3 h-3 opacity-60" />
            <span>{readingTimeMinutes} min read</span>
          </div>
        </>
      )}

      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />

      {/* Persistence & Cloud Sync State Badge */}
      <div className="flex items-center gap-1">
        {isSaving ? (
          <span
            className="flex items-center gap-1 text-amber-500 font-medium"
            title="Writing changes to local IndexedDB and mounted disk..."
          >
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span className="hidden sm:inline">Saving</span>
          </span>
        ) : isSyncActive ? (
          <span
            className="flex items-center gap-1 text-indigo-400 font-medium"
            title={`Google Drive Sync: ${syncProgress.currentAction || 'Synchronizing files'}`}
          >
            <Cloud className="w-2.5 h-2.5 animate-pulse text-indigo-500" />
            <span className="hidden sm:inline">Syncing</span>
          </span>
        ) : (
          <span
            className="flex items-center gap-1 text-emerald-500 font-medium"
            title="Document up to date and persisted locally"
          >
            <Check className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Saved</span>
          </span>
        )}
      </div>
    </div>
  );
}
