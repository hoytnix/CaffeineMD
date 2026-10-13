'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  col: string;
  files: VaultFile[];
  columns: string[];
  isGroupingByEisenhower: boolean;
  isOver: boolean;
  draggedPath: string | null;
  activeColumnForNew: string | null;
  newCardTitle: string;
  onNewCardTitleChange: (val: string) => void;
  onSetActiveColumnForNew: (col: string | null) => void;
  onCreateCard: (col: string) => void;
  onDragOver: (e: React.DragEvent, col: string) => void;
  onDragLeave: (e: React.DragEvent, col: string) => void;
  onDrop: (e: React.DragEvent, col: string) => void;
  onDragStart: (e: React.DragEvent, path: string) => void;
  onDragEnd: () => void;
  onOpenFile: (path: string, title?: string) => void;
  onMoveStatus: (file: VaultFile, targetCol: string) => void;
}

export function KanbanColumn({
  col,
  files,
  columns,
  isGroupingByEisenhower,
  isOver,
  draggedPath,
  activeColumnForNew,
  newCardTitle,
  onNewCardTitleChange,
  onSetActiveColumnForNew,
  onCreateCard,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onOpenFile,
  onMoveStatus,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, col)}
      onDragLeave={(e) => onDragLeave(e, col)}
      onDrop={(e) => onDrop(e, col)}
      style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
      className={`w-72 shrink-0 rounded-xl border transition-all flex flex-col p-3 shadow-xs ${
        isOver
          ? 'ring-2 ring-indigo-500/30'
          : ''
      }`}
    >
      {/* Column Header */}
      <div
        style={{ borderColor: 'var(--theme-border)' }}
        className="flex items-center justify-between pb-2 mb-2 border-b"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {col}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
            {files.length}
          </span>
        </div>
        <button
          onClick={() => onSetActiveColumnForNew(col)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards List / Drop Target */}
      <div className="space-y-2 flex-1 min-h-[120px]">
        {files.map((file) => (
          <KanbanCard
            key={file.path}
            file={file}
            col={col}
            columns={columns}
            isGroupingByEisenhower={isGroupingByEisenhower}
            isDragging={draggedPath === file.path}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onOpenFile={onOpenFile}
            onMoveStatus={onMoveStatus}
          />
        ))}

        {/* Add Card Form */}
        {activeColumnForNew === col ? (
          <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-500 shadow-xs">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => onNewCardTitleChange(e.target.value)}
              placeholder="Note title..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateCard(col);
                if (e.key === 'Escape') onSetActiveColumnForNew(null);
              }}
              className="w-full text-xs bg-transparent border-none outline-none mb-2 text-neutral-900 dark:text-neutral-100"
            />
            <div className="flex items-center gap-1.5 justify-end">
              <button
                onClick={() => onSetActiveColumnForNew(null)}
                className="px-2 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreateCard(col)}
                className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onSetActiveColumnForNew(col)}
            className="w-full py-1.5 flex items-center justify-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New note</span>
          </button>
        )}
      </div>
    </div>
  );
}
