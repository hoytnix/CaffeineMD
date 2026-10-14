'use client';

import React from 'react';
import { Sliders } from 'lucide-react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
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
  return (
    <div className="space-y-8">
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
