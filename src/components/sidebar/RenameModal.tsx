'use client';

import React, { useState } from 'react';
import { Edit3, X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  isFolder: boolean;
  onConfirm: (newName: string) => Promise<void>;
}

export function RenameModal({
  isOpen,
  onClose,
  currentTitle,
  isFolder,
  onConfirm,
}: RenameModalProps) {
  if (!isOpen) return null;

  return (
    <RenameModalForm
      key={currentTitle}
      onClose={onClose}
      currentTitle={currentTitle}
      isFolder={isFolder}
      onConfirm={onConfirm}
    />
  );
}

interface RenameModalFormProps {
  onClose: () => void;
  currentTitle: string;
  isFolder: boolean;
  onConfirm: (newName: string) => Promise<void>;
}

function RenameModalForm({
  onClose,
  currentTitle,
  isFolder,
  onConfirm,
}: RenameModalFormProps) {
  const [val, setVal] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!val.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(val.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-5 text-[var(--foreground)] space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                Rename {isFolder ? 'Folder' : 'Note'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            disabled={isSubmitting}
            placeholder={isFolder ? 'Folder name' : 'Note title'}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !val.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
