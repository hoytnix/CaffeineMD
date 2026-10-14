'use client';

import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import {
  SHORTCUT_DEFINITIONS,
  ShortcutActionId,
  eventToComboString,
  formatShortcutForDisplay,
} from '@/src/lib/shortcuts/shortcutManager';

export function KeyboardShortcutsSection() {
  const {
    keyboardShortcuts,
    setKeyboardShortcut,
    resetKeyboardShortcuts,
    showToast,
  } = useWorkspaceStore();

  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);

  useEffect(() => {
    if (!recordingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingId(null);
        return;
      }

      const combo = eventToComboString(e);
      if (!combo) return; // Modifiers only pressed

      // Detect and handle conflict by swapping
      const conflictingAction = (Object.keys(keyboardShortcuts) as ShortcutActionId[]).find(
        (id) => id !== recordingId && keyboardShortcuts[id] === combo
      );

      if (conflictingAction) {
        const prevCombo = keyboardShortcuts[recordingId];
        setKeyboardShortcut(conflictingAction, prevCombo);
        const conflictLabel =
          SHORTCUT_DEFINITIONS.find((d) => d.id === conflictingAction)?.label || conflictingAction;
        showToast?.(`Swapped shortcut with "${conflictLabel}"`);
      }

      setKeyboardShortcut(recordingId, combo);
      setRecordingId(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingId, keyboardShortcuts, setKeyboardShortcut, showToast]);

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            Customizable Keyboard Shortcuts
          </span>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            Click any shortcut to record a new key combination or press Esc to cancel
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetKeyboardShortcuts();
            showToast?.('All shortcuts reset to defaults');
          }}
          className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs text-xs">
        {SHORTCUT_DEFINITIONS.map((def) => {
          const currentCombo = keyboardShortcuts[def.id] || def.defaultCombo;
          const isModified = currentCombo !== def.defaultCombo;
          const isRecording = recordingId === def.id;

          return (
            <div
              key={def.id}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--foreground)]/[0.02] transition-colors"
            >
              <div>
                <span className="text-[var(--foreground)] font-medium block">
                  {def.label}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {def.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={() => setRecordingId(null)}
                    className="px-2.5 py-1 rounded-lg border border-amber-500/60 bg-amber-500/10 text-amber-400 font-mono text-[11px] animate-pulse cursor-pointer"
                  >
                    Press keys... (Esc to cancel)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRecordingId(def.id)}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
                      isModified
                        ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-400'
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-indigo-400'
                    }`}
                    title="Click to record new shortcut"
                  >
                    {formatShortcutForDisplay(currentCombo)}
                  </button>
                )}

                {isModified && !isRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyboardShortcut(def.id, def.defaultCombo);
                      showToast?.(`Reset ${def.label} shortcut`);
                    }}
                    title="Reset to default"
                    className="p-1 rounded text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
