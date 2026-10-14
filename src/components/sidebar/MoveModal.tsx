'use client';

import React, { useState, useMemo } from 'react';
import { FolderInput, Folder, CornerDownRight, Check, Search } from 'lucide-react';
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

  const cleanDestination = useMemo(() => {
    return folder.trim().replace(/^\/+|\/+$/g, '');
  }, [folder]);

  // Filter folders based on text typed into the destination/filter input
  const filteredFolders = useMemo(() => {
    const query = cleanDestination.toLowerCase();
    if (!query) return folderSuggestions;
    return folderSuggestions.filter((f) => f.toLowerCase().includes(query));
  }, [folderSuggestions, cleanDestination]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(cleanDestination);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <FolderInput className="w-4 h-4" />
          </div>
          <span>Move Note</span>
        </div>
      }
      description={`Move "${fileName}" to a folder`}
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
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {isSubmitting ? 'Moving...' : 'Move Note'}
          </button>
        </>
      }
    >
      <form id="move-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
            Destination / Filter Path
          </label>
          <div className="relative">
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Memories/2026/October or leave empty for root"
              autoFocus
              disabled={isSubmitting}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Select an existing folder below, or type a new nested path with slashes.
          </p>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
            Select Folder
          </span>
          <div className="border border-[var(--border)] rounded-lg bg-[var(--background)] max-h-56 overflow-y-auto divide-y divide-[var(--border)]/40 p-1 space-y-0.5">
            {/* Root Option */}
            <button
              type="button"
              onClick={() => setFolder('')}
              className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                cleanDestination === ''
                  ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30'
                  : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">/ (Root)</span>
              </div>
              {cleanDestination === '' && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-400" />}
            </button>

            {/* Hierarchical Folder List */}
            {filteredFolders.map((f) => {
              const depth = f.split('/').length - 1;
              const isSelected = cleanDestination === f;
              const breadcrumb = f.split('/').join(' / ');

              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFolder(f)}
                  style={{ paddingLeft: `${depth * 14 + 10}px` }}
                  className={`w-full flex items-center justify-between py-1.5 pr-2.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {depth > 0 && (
                      <CornerDownRight className="w-3 h-3 text-neutral-500 shrink-0" />
                    )}
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`} />
                    <span className="truncate" title={f}>
                      {breadcrumb}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-400" />}
                </button>
              );
            })}

            {filteredFolders.length === 0 && cleanDestination !== '' && (
              <div className="px-3 py-3 text-center text-xs text-neutral-400">
                New nested sub-directory: <span className="font-mono text-indigo-400 font-semibold">{cleanDestination}</span>
                <div className="mt-0.5 text-[11px] text-neutral-500">Press &quot;Move Note&quot; to create and move.</div>
              </div>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
