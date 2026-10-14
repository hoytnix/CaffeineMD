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

  const stats = useMemo(() => {
    if (!editor) {
      return {
        wordCount: 0,
        charCount: 0,
        readingTimeMinutes: 0,
        links: 0,
        wikiLinks: 0,
      };
    }
    const text = editor.getText() || '';
    const trimmed = text.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    let mdLinks = 0;
    let wikiLinks = 0;
    try {
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'codeBlock') return false;
        if (node.type.name === 'wikiLink') {
          wikiLinks++;
        } else if (node.isText) {
          if (node.marks?.some((m) => m.type.name === 'link')) {
            mdLinks++;
          } else if (node.text) {
            const urls = node.text.match(/https?:\/\/[^\s<>)"]+/gi);
            if (urls) mdLinks += urls.length;
          }
        }
      });
    } catch {
      // Fallback if editor state is not yet ready
    }

    return {
      wordCount: words,
      charCount: text.length,
      readingTimeMinutes: words > 0 ? readingTime : 0,
      links: mdLinks,
      wikiLinks,
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
        title={`${stats.wordCount} total words written in note`}
      >
        <span className="font-medium text-[var(--foreground)]/80">{stats.wordCount}</span>
        <span>words</span>
      </div>

      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />

      {/* Character Count Metric */}
      <div
        className="flex items-center gap-1 font-mono hidden sm:flex"
        title={`${stats.charCount} raw characters`}
      >
        <span>{stats.charCount} chars</span>
      </div>

      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden lg:inline-block" />

      {/* Markdown Links & WikiLinks Metrics */}
      <span title="Markdown Links" className="hidden lg:inline-flex items-center gap-1 font-mono">
        <strong className="text-slate-400 font-semibold">{stats.links}</strong> {stats.links === 1 ? 'link' : 'links'}
      </span>

      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden lg:inline-block" />

      <span title="WikiLinks" className="hidden lg:inline-flex items-center gap-1 font-mono">
        <strong className="text-slate-400 font-semibold">{stats.wikiLinks}</strong> {stats.wikiLinks === 1 ? 'wikilink' : 'wikilinks'}
      </span>

      {stats.readingTimeMinutes > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden md:inline-block" />
          <div
            className="flex items-center gap-1 font-mono hidden md:flex text-neutral-400"
            title="Estimated reading duration at 200 wpm"
          >
            <BookOpen className="w-3 h-3 opacity-60" />
            <span>{stats.readingTimeMinutes} min read</span>
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
