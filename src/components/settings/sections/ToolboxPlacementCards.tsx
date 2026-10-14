'use client';

import React from 'react';
import { Check, PanelBottom, PanelTop, PanelLeft, PanelRight } from 'lucide-react';
import { ToolboxPosition } from '@/src/stores/workspaceStore';

export interface PlacementOption {
  id: ToolboxPosition;
  label: string;
  tag?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PLACEMENT_OPTIONS: PlacementOption[] = [
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

interface ToolboxPlacementCardsProps {
  toolboxPosition: ToolboxPosition;
  onSelectPosition: (pos: ToolboxPosition, label: string) => void;
}

export function ToolboxPlacementCards({
  toolboxPosition,
  onSelectPosition,
}: ToolboxPlacementCardsProps) {
  return (
    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {PLACEMENT_OPTIONS.map((opt) => {
        const isSelected = toolboxPosition === opt.id;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectPosition(opt.id, opt.label)}
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

            <div className="w-full h-16 rounded-lg bg-[var(--background)] border border-[var(--border)] p-2 relative flex flex-col justify-between overflow-hidden">
              <div className="h-1.5 w-1/3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <div className="space-y-1 my-auto">
                <div className="h-1 w-3/4 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-1 w-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>

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
  );
}
