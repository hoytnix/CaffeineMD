'use client';

import React from 'react';
import { Sliders, SunMedium } from 'lucide-react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { CustomThemeBuilder } from './CustomThemeBuilder';
import { ThemePresetGrid } from './ThemePresetGrid';

export interface ThemeSettingsSectionProps {
  themeId: string;
  setTheme: (id: string) => void;
  customTheme: ThemeDefinition;
  updateCustomTheme?: (partial: Partial<ThemeDefinition>) => void;
  showCustomWizard: boolean;
  setShowCustomWizard: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export function ThemeSettingsSection({
  themeId,
  setTheme,
  customTheme,
  updateCustomTheme,
  showCustomWizard,
  setShowCustomWizard,
}: ThemeSettingsSectionProps) {
  const { themeOpacity, setThemeOpacity } = useWorkspaceStore();
  const opacityPercent = Math.round(themeOpacity * 100);

  return (
    <div className="space-y-8">
      {/* Background / Theme Opacity Slider */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-bg-card-glass,var(--card))] border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Background / Theme Opacity</h3>
              <p className="text-xs text-neutral-400">
                Adjust the surface opacity to control theme background image visibility
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
            {opacityPercent}%
          </span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] font-mono text-neutral-400">10%</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={themeOpacity}
            onChange={(e) => setThemeOpacity(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            title={`Adjust theme opacity: ${opacityPercent}%`}
          />
          <span className="text-[11px] font-mono text-neutral-400">100%</span>
        </div>
      </div>

      {/* 1. AI Theme Studio & 2. Custom Theme Palette & Backdrop Wizard */}
      {updateCustomTheme && (
        <CustomThemeBuilder
          customTheme={customTheme}
          updateCustomTheme={updateCustomTheme}
          setTheme={setTheme}
          showCustomWizard={showCustomWizard}
          setShowCustomWizard={setShowCustomWizard}
        />
      )}

      {/* 3. Theme Presets & Customization */}
      <div>
        <div className="px-3 mb-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Theme Presets &amp; Customization
            </span>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              Select from 14 handcrafted presets or personalize your custom theme
            </p>
          </div>
          <button
            onClick={() => setShowCustomWizard((prev) => !prev)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showCustomWizard ? 'Hide Wizard' : 'Custom Wizard'}</span>
          </button>
        </div>

        <ThemePresetGrid
          themeId={themeId}
          setTheme={setTheme}
          customTheme={customTheme}
          setShowCustomWizard={setShowCustomWizard}
        />
      </div>
    </div>
  );
}
