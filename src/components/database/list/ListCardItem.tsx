'use client';

import React from 'react';
import { FileText, User, Clock } from 'lucide-react';
import { EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { extractCleanExcerpt } from '@/src/lib/markdown/excerpt';

export interface ListCardItemProps {
  file: {
    id: string;
    path: string;
    title?: string;
    name: string;
    updatedAt: number | Date;
    tags?: string[];
    frontmatter?: Record<string, unknown>;
    content?: string;
    eisenhower?: string;
  };
  onClick: (path: string) => void;
}

function formatRelativeDate(dateInput: number | Date): string {
  try {
    const timestamp = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    if (Number.isNaN(timestamp)) return '';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return new Date(dateInput).toLocaleDateString();
  }
}

export function ListCardItem({ file, onClick }: ListCardItemProps) {
  const currentEisenhower = normalizeEisenhower(
    file.eisenhower || (file.frontmatter?.eisenhower as string | undefined)
  );
  const eisenhowerOpt = EISENHOWER_CONFIG[currentEisenhower];
  const status =
    (file.frontmatter?.status as string | undefined) ||
    (file.frontmatter?.state as string | undefined) ||
    DEFAULT_NOTE_PROPERTIES.status;
  const author = file.frontmatter?.author as string | undefined;
  const emoji = (file.frontmatter?.icon || file.frontmatter?.emoji) as string | undefined;
  const excerpt = extractCleanExcerpt(file.content || '', 240);
  const formattedDate = formatRelativeDate(file.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(file.path)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(file.path);
        }
      }}
      className="group flex flex-col justify-between p-4 rounded-xl border bg-[var(--card)] border-[var(--border)] hover:border-[var(--theme-accent,var(--primary))] hover:shadow-md transition-all cursor-pointer select-none text-left focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent,var(--primary))]"
    >
      <div>
        {/* Header: Icon, Title & Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {emoji ? (
              <span className="text-base shrink-0 leading-none">{emoji}</span>
            ) : (
              <FileText className="w-4 h-4 text-[var(--theme-accent,var(--primary))] shrink-0" />
            )}
            <h3 className="font-semibold text-xs sm:text-sm text-[var(--foreground)] group-hover:text-[var(--theme-accent,var(--primary))] transition-colors truncate">
              {file.title || file.name}
            </h3>
          </div>

          {eisenhowerOpt && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${eisenhowerOpt.badgeClass}`}
              title={`Eisenhower: ${eisenhowerOpt.label}`}
            >
              {eisenhowerOpt.shortLabel}
            </span>
          )}
        </div>

        {/* Status Pill & Author */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {status && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-primary)] text-[var(--foreground)] opacity-90 border border-[var(--border)] shrink-0">
              {status}
            </span>
          )}
          {author && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--foreground)] opacity-60 truncate">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{author}</span>
            </span>
          )}
        </div>

        {/* 3-line Excerpt Preview */}
        <p className="text-xs text-[var(--foreground)] opacity-75 leading-relaxed line-clamp-3 mb-3">
          {excerpt || <span className="italic opacity-50">Empty note body</span>}
        </p>
      </div>

      {/* Footer: Tags & Timestamp */}
      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1 overflow-hidden flex-wrap max-h-5">
          {file.tags && file.tags.length > 0 ? (
            file.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--bg-primary)] text-[var(--foreground)] opacity-75 border border-[var(--border)] truncate"
              >
                #{t.replace(/^#/, '')}
              </span>
            ))
          ) : (
            <span className="text-[10px] opacity-40 italic">No tags</span>
          )}
          {file.tags && file.tags.length > 3 && (
            <span className="text-[10px] opacity-50 font-mono">+{file.tags.length - 3}</span>
          )}
        </div>

        <span
          className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--foreground)] opacity-60 shrink-0"
          title={new Date(file.updatedAt).toLocaleString()}
        >
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{formattedDate}</span>
        </span>
      </div>
    </div>
  );
}
