'use client';

import React, { useState } from 'react';
import { FolderInput } from 'lucide-react';
import { ModalShell } from '@/src/components/common/ModalShell';

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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <FolderInput className="w-4 h-4" />
          </div>
          <span>Move Note</span>
        </div>
      }
      description={fileName}
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
            form="move-form"
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
          >
            Move
          </button>
        </>
      }
    >
      <form id="move-form" onSubmit={handleSubmit} className="space-y-3">
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
      </form>
    </ModalShell>
  );
}
