'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useFindReplaceStore } from '@/src/stores/findReplaceStore';
import {
  Columns as SplitIcon,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  Map as MapIcon,
  Download,
  Replace,
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
    isTypewriterScrolling,
    toggleTypewriterScrolling,
    showMinimap,
    toggleMinimap,
  } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
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

      {/* Typewriter Scrolling Toggle */}
      <button
        type="button"
        onClick={toggleTypewriterScrolling}
        className={`p-1.5 rounded-md border border-[var(--border)] transition-colors cursor-pointer ${
          isTypewriterScrolling
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)]'
        }`}
        title={`Typewriter Scrolling (${isTypewriterScrolling ? 'On' : 'Off'})`}
        aria-label="Toggle typewriter scrolling"
      >
        <ChevronsUpDown className="w-3.5 h-3.5" />
      </button>

      {/* Editor Minimap Toggle */}
      <button
        type="button"
        onClick={toggleMinimap}
        className={`p-1.5 rounded-md border border-[var(--border)] transition-colors cursor-pointer ${
          showMinimap
            ? 'bg-[var(--card)] text-[var(--foreground)]'
            : 'bg-[var(--card)] text-neutral-400 opacity-60 hover:opacity-100'
        }`}
        title={`Minimap Overview (${showMinimap ? 'Visible' : 'Hidden'})`}
        aria-label="Toggle minimap"
      >
        <MapIcon className="w-3.5 h-3.5" />
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

      {/* Vault RegEx Find & Replace (⌘⇧H) */}
      <button
        type="button"
        onClick={() => useFindReplaceStore.getState().setOpen(true)}
        className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer"
        title="Vault Find & Replace (⌘⇧H)"
        aria-label="Vault Find & Replace"
      >
        <Replace className="w-3.5 h-3.5" />
      </button>

      {/* Export Document / PWA */}
      <button
        type="button"
        onClick={() => useWorkspaceStore.getState().openExportModal()}
        className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer"
        title="Export Document / PWA"
        aria-label="Export Document / PWA"
      >
        <Download className="w-3.5 h-3.5" />
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
