'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export function EditorDisplayBehaviorGroup() {
  const showMinimap = useWorkspaceStore((s) => s.showMinimap);
  const toggleMinimap = useWorkspaceStore((s) => s.toggleMinimap);
  const typewriterMode = useWorkspaceStore((s) => s.typewriterMode);
  const toggleTypewriterMode = useWorkspaceStore((s) => s.toggleTypewriterMode);
  const editorFontSize = useWorkspaceStore((s) => s.editorFontSize);
  const setEditorFontSize = useWorkspaceStore((s) => s.setEditorFontSize);
  const spellcheck = useWorkspaceStore((s) => s.spellcheck);
  const toggleSpellcheck = useWorkspaceStore((s) => s.toggleSpellcheck);

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Editor Display &amp; Behavior
        </span>
      </div>

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs divide-y divide-[var(--border)] px-4 sm:px-5">
        {/* Base Font Size (px) Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Base Font Size
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Adjust the base font size for writing and drafting notes.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-neutral-400 font-mono">12px</span>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={editorFontSize}
              onChange={(e) => setEditorFontSize(Number(e.target.value))}
              className="w-32 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-neutral-400 font-mono">24px</span>
            <span className="text-xs font-semibold text-indigo-500 font-mono w-10 text-right">
              {editorFontSize}px
            </span>
          </div>
        </div>

        {/* Show Document Minimap Toggle */}
        <div className="flex items-center justify-between py-3.5">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Show Document Minimap
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Display a high-level visual code minimap on the right edge of the editor.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showMinimap}
            onClick={toggleMinimap}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              showMinimap ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                showMinimap ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Typewriter Scrolling Mode Toggle */}
        <div className="flex items-center justify-between py-3.5">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Typewriter Scrolling Mode
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Keep the active cursor line vertically centered in the viewport while drafting.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={typewriterMode}
            onClick={toggleTypewriterMode}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              typewriterMode ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                typewriterMode ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Spellcheck Toggle */}
        <div className="flex items-center justify-between py-3.5">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Spellcheck
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Enable browser native spellchecking and autocorrect highlights in note editor.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={spellcheck}
            onClick={toggleSpellcheck}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              spellcheck ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                spellcheck ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
