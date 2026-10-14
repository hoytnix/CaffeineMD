'use client';

import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import {
  ToolboxPosition,
  AUTOSAVE_INTERVAL_PRESETS,
  useWorkspaceStore,
} from '@/src/stores/workspaceStore';
import { ToolboxPlacementCards } from './ToolboxPlacementCards';
import { EditorDisplayBehaviorGroup } from './EditorDisplayBehaviorGroup';
import { CodeExecutionSandboxSection } from './CodeExecutionSandboxSection';

export interface EditorSettingsSectionProps {
  toolboxPosition: ToolboxPosition;
  setToolboxPosition: (position: ToolboxPosition) => void;
  autosaveInterval?: number;
  setAutosaveInterval?: (interval: number) => void;
  showToast?: (msg: string) => void;
}

export function EditorSettingsSection({
  toolboxPosition,
  setToolboxPosition,
  autosaveInterval,
  setAutosaveInterval,
  showToast,
}: EditorSettingsSectionProps) {
  const storeAutosaveInterval = useWorkspaceStore((s) => s.autosaveInterval);
  const storeSetAutosaveInterval = useWorkspaceStore((s) => s.setAutosaveInterval);

  const activeAutosaveInterval = autosaveInterval ?? storeAutosaveInterval;
  const updateAutosaveInterval = setAutosaveInterval ?? storeSetAutosaveInterval;

  const handleSelectPosition = (pos: ToolboxPosition, label: string) => {
    setToolboxPosition(pos);
    showToast?.(`Toolbox docked to ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Editor & Toolbox Position */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Editor &amp; Toolbox
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            Active: {toolboxPosition.toUpperCase()}
          </span>
        </div>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs divide-y divide-[var(--border)]">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--background)]/40">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Editor Toolbox Position
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Sparkles className="w-2.5 h-2.5" />
                  Customizable
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Configure which side of the note canvas you want the floating formatting toolbox docked to.
              </p>
            </div>
          </div>

          <ToolboxPlacementCards
            toolboxPosition={toolboxPosition}
            onSelectPosition={handleSelectPosition}
          />

          {/* Autosave Frequency Configuration */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--background)]/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Autosave Frequency
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Configure how frequently CaffeineMD automatically saves your edits to local IndexedDB and live disk.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={activeAutosaveInterval}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateAutosaveInterval(val);
                  const preset = AUTOSAVE_INTERVAL_PRESETS.find((p) => p.value === val);
                  showToast?.(`Autosave set to ${preset?.label || `${val / 1000}s`}`);
                }}
                className="px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium outline-none focus:border-[var(--accent)] cursor-pointer shadow-2xs hover:border-[var(--foreground)]/30 transition-colors"
              >
                {AUTOSAVE_INTERVAL_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Display & Behavior (Font size slider, Minimap, Typewriter, Spellcheck) */}
      <EditorDisplayBehaviorGroup />

      {/* Code Execution Sandbox (WASM & Runtimes Cache) */}
      <CodeExecutionSandboxSection />
    </div>
  );
}
