'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import {
  Columns as SplitIcon,
  Maximize2,
  Minimize2,
  AlignLeft,
  Save,
  Trash2,
} from 'lucide-react';

interface EditorUxControlsProps {
  onManualSave: () => void;
  isSaveDisabled: boolean;
  onDelete: () => void;
}

export function EditorUxControls({
  onManualSave,
  isSaveDisabled,
  onDelete,
}: EditorUxControlsProps) {
  const {
    toggleSplitPane,
    splitPaneMode,
    isFocusMode,
    toggleFocusMode,
    isOutlineOpen,
    toggleOutline,
  } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Outline TOC HUD Toggle */}
      <button
        type="button"
        onClick={toggleOutline}
        className={`p-1.5 rounded-md border border-[var(--border)] transition-colors cursor-pointer ${
          isOutlineOpen
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)]'
        }`}
        title={`Document Outline HUD (${isOutlineOpen ? 'Open' : 'Closed'})`}
        aria-label="Toggle document outline HUD"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>

      {/* Split Pane View Toggle (⌘\) */}
      <button
        type="button"
        onClick={toggleSplitPane}
        className={`p-1.5 rounded-md border border-[var(--border)] transition-colors cursor-pointer ${
          splitPaneMode !== 'none'
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)]'
        }`}
        title={`Dual Split View (${splitPaneMode !== 'none' ? 'Active' : 'Off'} - ⌘\\)`}
        aria-label="Toggle split view"
      >
        <SplitIcon className="w-3.5 h-3.5" />
      </button>

      {/* Distraction-Free Focus Mode (F11 / ⌘⇧F) */}
      <button
        type="button"
        onClick={toggleFocusMode}
        className={`p-1.5 rounded-md border border-[var(--border)] transition-colors cursor-pointer ${
          isFocusMode
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)]'
        }`}
        title="Focus Mode (⌘⇧F / F11)"
        aria-label="Toggle focus mode"
      >
        {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>

      {/* Save Button */}
      <button
        type="button"
        onClick={onManualSave}
        disabled={isSaveDisabled}
        className="p-1.5 rounded-md bg-[var(--card)] hover:bg-[var(--border)]/60 text-[var(--foreground)] border border-[var(--border)] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
        title="Save note (⌘S)"
        aria-label="Save note (⌘S)"
      >
        <Save className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {/* Trash Can / Delete Note Button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        title="Delete note"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
