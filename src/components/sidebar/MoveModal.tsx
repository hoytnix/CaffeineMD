'use client';

import React, { useState } from 'react';
import { FolderInput, X } from 'lucide-react';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  currentFolder: string;
  folderSuggestions: string[];
  onConfirm: (targetFolder: string) => Promise<void>;
}

export function MoveModal({
  isOpen,
  onClose,
  fileName,
  currentFolder,
  folderSuggestions,
  onConfirm,
}: MoveModalProps) {
  if (!isOpen) return null;

  return (
    <MoveModalForm
      key={`${fileName}-${currentFolder}`}
      onClose={onClose}
      fileName={fileName}
      currentFolder={currentFolder}
      folderSuggestions={folderSuggestions}
      onConfirm={onConfirm}
    />
  );
}

interface MoveModalFormProps {
  onClose: () => void;
  fileName: string;
  currentFolder: string;
  folderSuggestions: string[];
  onConfirm: (targetFolder: string) => Promise<void>;
}

function MoveModalForm({
  onClose,
  fileName,
  currentFolder,
  folderSuggestions,
  onConfirm,
}: MoveModalFormProps) {
  const [folder, setFolder] = useState(currentFolder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(folder.trim());
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
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">Move Note</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[200px]">
                {fileName}
              </p>
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
          <div>
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              Destination Folder
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Projects or leave empty for root"
              autoFocus
              disabled={isSubmitting}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {folderSuggestions.length > 0 && (
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1">Existing folders:</span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setFolder('')}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    folder === ''
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'border-[var(--border)] hover:bg-neutral-800/40 text-neutral-400'
                  }`}
                >
                  / (Root)
                </button>
                {folderSuggestions.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFolder(f)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      folder === f
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                        : 'border-[var(--border)] hover:bg-neutral-800/40 text-neutral-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
