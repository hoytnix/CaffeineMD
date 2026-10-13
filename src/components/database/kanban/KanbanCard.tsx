'use client';

import React from 'react';
import { VaultFile, EISENHOWER_CONFIG, EisenhowerQuadrant } from '@/src/lib/storage/db';
import { User } from 'lucide-react';

interface KanbanCardProps {
  file: VaultFile;
  col: string;
  columns: string[];
  isGroupingByEisenhower: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, path: string) => void;
  onDragEnd: () => void;
  onOpenFile: (path: string, title?: string) => void;
  onMoveStatus: (file: VaultFile, targetCol: string) => void;
}

export function KanbanCard({
  file,
  col,
  columns,
  isGroupingByEisenhower,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpenFile,
  onMoveStatus,
}: KanbanCardProps) {
  const rawQuadrant = (file.eisenhower || file.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
  const opt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, file.path)}
      onDragEnd={onDragEnd}
      style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
      className={`p-3 rounded-lg border shadow-xs transition-all group cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 scale-[0.98]'
          : 'hover:border-[var(--theme-accent)]'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <button
          onClick={() => onOpenFile(file.path, file.title)}
          className="text-left font-medium text-xs text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate flex-1 cursor-pointer"
        >
          {file.title || file.name}
        </button>

        {opt && (
          <span
            title={`Eisenhower: ${opt.label}`}
            aria-label={opt.label}
            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotBg}`}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {isGroupingByEisenhower && (
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
            {file.frontmatter?.status || 'Draft'}
          </span>
        )}
        {file.frontmatter?.author && (
          <span className="flex items-center gap-0.5 text-neutral-500 font-mono">
            <User className="w-2.5 h-2.5" />
            <span>{file.frontmatter.author}</span>
          </span>
        )}
        {file.frontmatter?.priority && (
          <span className="text-neutral-500 font-mono">
            Priority: {file.frontmatter.priority}
          </span>
        )}
      </div>

      {file.tags && file.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-neutral-400">
          {file.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-[10px] text-neutral-400">
        <span>Move to:</span>
        <select
          value={col}
          onChange={(e) => onMoveStatus(file, e.target.value)}
          className="bg-transparent text-[11px] text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer max-w-[160px] truncate"
        >
          {columns.map((c) => (
            <option key={c} value={c} className="bg-white dark:bg-neutral-900">
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
