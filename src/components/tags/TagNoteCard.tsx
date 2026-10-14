'use client';

import React from 'react';
import { VaultFile, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { extractCleanExcerpt } from '@/src/lib/markdown/excerpt';
import { FileText, ArrowRight } from 'lucide-react';

export interface TagNoteCardProps {
  note: VaultFile;
  activeTag: string;
  onOpenNote: (path: string, title?: string) => void;
  onSelectTag: (tag: string) => void;
}

export function TagNoteCard({
  note,
  activeTag,
  onOpenNote,
  onSelectTag,
}: TagNoteCardProps) {
  const rawQuadrant = (note.eisenhower || note.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
  const eisenhowerOpt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;
  const excerpt = extractCleanExcerpt(note.content || '', 400);

  return (
    <div
      onClick={() => onOpenNote(note.path, note.title)}
      style={{
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'var(--theme-border)',
      }}
      className="group flex flex-col justify-between p-5 rounded-xl border hover:shadow-md transition-all cursor-pointer"
    >
      {/* Top Note Metadata Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 truncate">
            {eisenhowerOpt && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${eisenhowerOpt.dotBg}`}
                title={`Eisenhower: ${eisenhowerOpt.label}`}
              />
            )}
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {note.title || note.name}
            </h3>
          </div>

          {eisenhowerOpt && (
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${eisenhowerOpt.badgeClass}`}
              title={eisenhowerOpt.label}
            >
              {eisenhowerOpt.shortLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mb-3 truncate">
          <span className="truncate">{note.path}</span>
          <span>·</span>
          <span className="shrink-0 tabular-nums">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* 400-Character Plaintext Excerpt Preview */}
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-5">
          {excerpt || <span className="italic text-neutral-400">Empty note body</span>}
        </p>
      </div>

      {/* Bottom Secondary Tags List */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 items-center overflow-hidden">
          {note.tags && note.tags.length > 0 ? (
            note.tags.map((t) => {
              const cleanTag = t.replace(/^#/, '');
              const isTagActive = activeTag.toLowerCase() === cleanTag.toLowerCase();
              return (
                <button
                  key={cleanTag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag(cleanTag);
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    isTagActive
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  #{cleanTag}
                </button>
              );
            })
          ) : (
            <span className="text-[11px] text-neutral-400 italic">No tags</span>
          )}
        </div>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
