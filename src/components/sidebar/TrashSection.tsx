'use client';

import React, { useState } from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Trash2, Undo2, ChevronDown, ChevronRight } from 'lucide-react';

interface TrashSectionProps {
  trashFiles: VaultFile[];
}

export function TrashSection({ trashFiles }: TrashSectionProps) {
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const { restoreNote, deleteNote, emptyTrashAll } = useWorkspaceStore();

  return (
    <div className="border-t border-[var(--border)] px-1.5 py-1">
      <div
        onClick={() => setIsTrashOpen((prev) => !prev)}
        className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-neutral-800/30 cursor-pointer text-xs font-medium text-neutral-400 hover:text-[var(--foreground)] transition-colors select-none group"
      >
        <div className="flex items-center gap-1.5">
          {isTrashOpen ? (
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
          )}
          <Trash2 className="w-3.5 h-3.5 text-rose-400/80 shrink-0" />
          <span>Trash</span>
        </div>
        <div className="flex items-center gap-1.5">
          {trashFiles.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 font-mono">
              {trashFiles.length}
            </span>
          )}
        </div>
      </div>

      {isTrashOpen && (
        <div className="pl-4 pr-1 py-1 space-y-1">
          {trashFiles.length === 0 ? (
            <div className="text-[11px] text-neutral-500 py-1 pl-2">Trash is empty</div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-neutral-500">
                <span>{trashFiles.length} item{trashFiles.length === 1 ? '' : 's'}</span>
                <button
                  onClick={() => {
                    if (confirm('Permanently delete all notes in Trash?')) {
                      emptyTrashAll();
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Empty
                </button>
              </div>
              {trashFiles.map((tf) => (
                <div
                  key={tf.path}
                  className="flex items-center justify-between py-1 px-2 rounded-md bg-neutral-900/30 text-xs text-neutral-400 group hover:text-[var(--foreground)]"
                >
                  <span className="truncate text-[11px] line-through opacity-75">
                    {tf.title || tf.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreNote(tf.path)}
                      title="Restore note"
                      className="min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete "${tf.title || tf.name}"?`)) {
                          deleteNote(tf.path);
                        }
                      }}
                      title="Delete permanently"
                      className="min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
