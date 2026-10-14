'use client';

import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { ModalShell } from '@/src/components/common/ModalShell';

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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Edit3 className="w-4 h-4" />
          </div>
          <span>Rename {isFolder ? 'Folder' : 'Note'}</span>
        </div>
      }
      footer={
        <>
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
            form="rename-form"
            disabled={isSubmitting || !val.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
          >
            Rename
          </button>
        </>
      }
    >
      <form id="rename-form" onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          disabled={isSubmitting}
          placeholder={isFolder ? 'Folder name' : 'Note title'}
          className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </form>
    </ModalShell>
  );
}
