'use client';

import React from 'react';
import { Check, PanelBottom, PanelTop, PanelLeft, PanelRight, Sparkles } from 'lucide-react';
import { ToolboxPosition } from '@/src/stores/workspaceStore';

export interface EditorSettingsSectionProps {
  toolboxPosition: ToolboxPosition;
  setToolboxPosition: (position: ToolboxPosition) => void;
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
  showToast,
}: EditorSettingsSectionProps) {
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
        </div>
      </div>
    </div>
  );
}
