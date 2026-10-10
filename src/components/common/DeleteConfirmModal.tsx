'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export function DeleteConfirmModal() {
  const {
    isDeleteModalOpen,
    deleteModalTarget,
    closeDeleteModal,
    confirmDeleteNote,
    trashRetentionDays,
  } = useWorkspaceStore();

  if (!isDeleteModalOpen || !deleteModalTarget) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDeleteModal();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-6 text-[var(--foreground)] space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="text-base font-semibold leading-tight">
                Move Note to Trash?
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Held for {trashRetentionDays} days before auto-purge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDeleteModal}
            className="p-1 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2 text-sm text-neutral-300">
          <p>
            Are you sure you want to move <span className="font-semibold text-[var(--foreground)]">“{deleteModalTarget.title}”</span> to the trash?
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            You can restore this note at any time from the Trash folder before the {trashRetentionDays}-day retention period expires.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={closeDeleteModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => confirmDeleteNote()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
}
