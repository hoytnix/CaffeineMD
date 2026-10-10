'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { FileText, Code, Save, Check } from 'lucide-react';

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
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
      <div className="flex items-center gap-2 text-xs text-neutral-500 truncate">
        <span className="truncate">{file.path}</span>
        {file.tags && file.tags.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 truncate">
              {file.tags.map((tag) => (
                <span key={tag} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                  #{tag}
                </span>
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
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs shadow-2xs">
          <button
            type="button"
            onClick={onSwitchToRichText}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              editorMode === 'rich'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Save note (⌘S)"
        >
          <Save className="w-3.5 h-3.5 text-neutral-500" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
