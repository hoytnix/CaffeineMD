'use client';

import React, { useEffect, useRef } from 'react';
import { Edit3, Copy, FolderInput, Trash2 } from 'lucide-react';

export interface FileActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  filePath: string;
  fileName: string;
  isFolder: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onTrash: () => void;
}

export function FileActionMenu({
  isOpen,
  onClose,
  anchorRect,
  fileName,
  isFolder,
  onRename,
  onDuplicate,
  onMove,
  onTrash,
}: FileActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // Calculate coordinates ensuring menu doesn't overflow screen bottom
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 180);
  const left = Math.min(Math.max(anchorRect.left, 8), window.innerWidth - 180);

  return (
    <div
      ref={menuRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      role="menu"
      aria-label={`Actions for ${fileName}`}
      className="fixed z-50 min-w-[160px] py-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl text-[var(--foreground)] text-xs animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider truncate border-b border-[var(--border)] mb-1">
        {fileName}
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onRename();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
        <span>Rename</span>
      </button>

      {!isFolder && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onDuplicate();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-neutral-400" />
          <span>Duplicate</span>
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onMove();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer transition-colors"
      >
        <FolderInput className="w-3.5 h-3.5 text-neutral-400" />
        <span>Move to...</span>
      </button>

      <div className="my-1 border-t border-[var(--border)]" />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onTrash();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-500/10 text-rose-500 text-left cursor-pointer transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{isFolder ? 'Delete Folder' : 'Move to Trash'}</span>
      </button>
    </div>
  );
}
