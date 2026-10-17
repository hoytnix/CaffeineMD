'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';

export interface KanbanColumnMenuProps {
  col: string;
  cardCount: number;
  canDelete: boolean;
  onRename: (oldCol: string, newCol: string) => void;
  onDelete: (col: string) => void;
}

export function KanbanColumnMenu({ col, cardCount, canDelete, onRename, onDelete }: KanbanColumnMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(col);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setDraftName(col);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, col]);

  const handleRenameSubmit = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== col) onRename(col, trimmed);
    setIsRenaming(false);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
          setIsRenaming(false);
          setDraftName(col);
        }}
        title="Column options"
        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 cursor-pointer"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          className="absolute right-0 top-7 z-30 w-52 rounded-lg border p-1.5 shadow-xl text-xs"
        >
          {isRenaming ? (
            <div className="p-1 space-y-1.5">
              <span className="block text-[10px] font-medium text-neutral-400">Rename column</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') { setIsRenaming(false); setDraftName(col); }
                  }}
                  className="flex-1 min-w-0 px-2 py-1 rounded border border-[var(--border)] bg-transparent text-xs outline-none focus:border-indigo-500"
                />
                <button type="button" onClick={handleRenameSubmit} className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer" title="Save">
                  <Check className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => { setIsRenaming(false); setDraftName(col); }} className="p-1 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer" title="Cancel">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => { setDraftName(col); setIsRenaming(true); }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-left hover:bg-neutral-500/10 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                <span>Rename Column</span>
              </button>
              <button
                type="button"
                disabled={!canDelete}
                onClick={() => { setIsOpen(false); onDelete(col); }}
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-left text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Column</span>
                </span>
                {cardCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/15 font-mono">
                    {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
