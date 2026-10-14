'use client';

import React from 'react';
import { Check, PanelBottom, PanelTop, PanelLeft, PanelRight, Sparkles, Clock } from 'lucide-react';
import {
  ToolboxPosition,
  AUTOSAVE_INTERVAL_PRESETS,
  useWorkspaceStore,
} from '@/src/stores/workspaceStore';

export interface EditorSettingsSectionProps {
  toolboxPosition: ToolboxPosition;
  setToolboxPosition: (position: ToolboxPosition) => void;
  autosaveInterval?: number;
  setAutosaveInterval?: (interval: number) => void;
  showToast?: (msg: string) => void;
}

interface PlacementOption {
  id: ToolboxPosition;
  label: string;
  tag?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PLACEMENT_OPTIONS: PlacementOption[] = [
  {
    id: 'bottom',
    label: 'Bottom',
    tag: 'Default',
    description: 'Floating horizontal pill docked at the bottom center',
    icon: PanelBottom,
  },
  {
    id: 'top',
    label: 'Top',
    description: 'Floating horizontal pill docked below the note header',
    icon: PanelTop,
  },
  {
    id: 'left',
    label: 'Left',
    description: 'Vertical tool palette docked along the left margin',
    icon: PanelLeft,
  },
  {
    id: 'right',
    label: 'Right',
    description: 'Vertical tool palette docked along the right margin',
    icon: PanelRight,
  },
];

export function EditorSettingsSection({
  toolboxPosition,
  setToolboxPosition,
  autosaveInterval,
  setAutosaveInterval,
  showToast,
}: EditorSettingsSectionProps) {
  const storeAutosaveInterval = useWorkspaceStore((s) => s.autosaveInterval);
  const storeSetAutosaveInterval = useWorkspaceStore((s) => s.setAutosaveInterval);
  const showMinimap = useWorkspaceStore((s) => s.showMinimap);
  const toggleMinimap = useWorkspaceStore((s) => s.toggleMinimap);
  const typewriterMode = useWorkspaceStore((s) => s.typewriterMode);
  const toggleTypewriterMode = useWorkspaceStore((s) => s.toggleTypewriterMode);
  const editorFontFamily = useWorkspaceStore((s) => s.editorFontFamily);
  const setEditorFontFamily = useWorkspaceStore((s) => s.setEditorFontFamily);

  const activeAutosaveInterval = autosaveInterval ?? storeAutosaveInterval;
  const updateAutosaveInterval = setAutosaveInterval ?? storeSetAutosaveInterval;

  const handleSelectPosition = (pos: ToolboxPosition, label: string) => {
    setToolboxPosition(pos);
    showToast?.(`Toolbox docked to ${label}`);
  };

  return (
    <div className="space-y-6">
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
          {/* Header Info */}
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

          {/* 4 Interactive Position Cards */}
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PLACEMENT_OPTIONS.map((opt) => {
              const isSelected = toolboxPosition === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPosition(opt.id, opt.label)}
                  className={`group relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20 shadow-xs'
                      : 'border-[var(--border)] hover:border-[var(--foreground)]/30 hover:bg-[var(--foreground)]/5 bg-[var(--card)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--background)] border border-[var(--border)] text-neutral-400 group-hover:text-[var(--foreground)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[var(--foreground)]">
                            {opt.label}
                          </span>
                          {opt.tag && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {opt.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--border)] bg-[var(--background)] text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {opt.description}
                  </p>

                  {/* Miniature Editor Mockup */}
                  <div className="w-full h-16 rounded-lg bg-[var(--background)] border border-[var(--border)] p-2 relative flex flex-col justify-between overflow-hidden">
                    {/* Header bar wireframe */}
                    <div className="h-1.5 w-1/3 rounded-full bg-neutral-300 dark:bg-neutral-700" />

                    {/* Note body lines */}
                    <div className="space-y-1 my-auto">
                      <div className="h-1 w-3/4 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                      <div className="h-1 w-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    {/* Miniature Toolbox Pill representation */}
                    {opt.id === 'top' && (
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-2 w-14 rounded-full bg-[var(--accent)] shadow-xs animate-pulse" />
                    )}
                    {opt.id === 'bottom' && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-14 rounded-full bg-[var(--accent)] shadow-xs animate-pulse" />
                    )}
                    {opt.id === 'left' && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-1.5 w-2 h-10 rounded-full bg-[var(--accent)] shadow-xs animate-pulse" />
                    )}
                    {opt.id === 'right' && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-2 h-10 rounded-full bg-[var(--accent)] shadow-xs animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Autosave Frequency Configuration Row */}
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

      {/* Editor Display & Behavior */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Editor Display &amp; Behavior
          </span>
        </div>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs divide-y divide-[var(--border)] px-4 sm:px-5">
          {/* Editor Font Family */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Editor Font Family
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose the primary typography stack for writing and drafting notes.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'sans' as const, label: 'Inter (Sans)' },
                { id: 'mono' as const, label: 'JetBrains (Mono)' },
                { id: 'serif' as const, label: 'Merriweather (Serif)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setEditorFontFamily(opt.id);
                    showToast?.(`Font set to ${opt.label}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    editorFontFamily === opt.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                      : 'bg-[var(--background)] border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Minimap Toggle */}
          <div className="flex items-center justify-between py-3.5">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Code Minimap
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

          {/* Typewriter Scrolling Toggle */}
          <div className="flex items-center justify-between py-3.5">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Typewriter Mode
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
        </div>
      </div>
    </div>
  );
}
