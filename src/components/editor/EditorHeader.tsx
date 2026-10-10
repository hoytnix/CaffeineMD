'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { FileText, Code, Save, Check, Trash2 } from 'lucide-react';

interface EditorHeaderProps {
  file: VaultFile;
  isSaving: boolean;
  saveSuccess: boolean;
  editorMode: 'rich' | 'plain';
  onSwitchToRichText: () => void;
  onSwitchToPlaintext: () => void;
  onManualSave: () => void;
  isSaveDisabled: boolean;
}

export function EditorHeader({
  file,
  isSaving,
  saveSuccess,
  editorMode,
  onSwitchToRichText,
  onSwitchToPlaintext,
  onManualSave,
  isSaveDisabled,
}: EditorHeaderProps) {
  const { setActiveView, setSelectedTagFilter, promptDeleteNote } = useWorkspaceStore();

  const handleTagClick = (tag: string) => {
    setSelectedTagFilter(tag);
    setActiveView('tags');
  };

  const handleDelete = () => {
    promptDeleteNote(file.path, file.title || file.name);
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center gap-2 text-xs text-neutral-500 truncate">
        <span className="truncate">{file.path}</span>
        {file.tags && file.tags.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 truncate">
              {file.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="px-1.5 py-0.5 rounded text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title={`View notes tagged #${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {isSaving ? (
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Saving...
          </span>
        ) : saveSuccess ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        ) : (
          <span className="text-xs text-neutral-400">Synced</span>
        )}

        {/* Mode Toggle: Rich Text Mode vs Plaintext Mode */}
        <div className="flex items-center p-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs shadow-2xs">
          <button
            type="button"
            onClick={onSwitchToRichText}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              editorMode === 'rich'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
            title="Rich Text Mode (WYSIWYG formatted editing)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rich Text</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToPlaintext}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              editorMode === 'plain'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
            title="Plaintext Mode (Raw Markdown editing)"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plaintext</span>
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={onManualSave}
          disabled={isSaveDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--card)] hover:bg-[var(--border)]/60 text-[var(--foreground)] border border-[var(--border)] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Save note (⌘S)"
        >
          <Save className="w-3.5 h-3.5 text-neutral-400" />
          <span>Save</span>
        </button>

        {/* Trash Can / Delete Note Button */}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Delete note"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
