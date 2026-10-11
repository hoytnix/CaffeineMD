'use client';

import React from 'react';
import { Check, Sliders } from 'lucide-react';
import { THEME_PRESETS, ThemeDefinition, DEFAULT_CUSTOM_THEME } from '@/src/lib/themes/themeDefinitions';

export interface ThemeSettingsSectionProps {
  themeId: string;
  setTheme: (id: string) => void;
  customTheme: ThemeDefinition;
  showCustomWizard: boolean;
  setShowCustomWizard: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export function ThemeSettingsSection({
  themeId,
  setTheme,
  customTheme,
  showCustomWizard,
  setShowCustomWizard,
}: ThemeSettingsSectionProps) {
  const nonCustomPresets = THEME_PRESETS.filter((t) => t.id !== 'custom');
  const activeCustomTheme = customTheme || DEFAULT_CUSTOM_THEME;

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {nonCustomPresets.map((t) => {
          const isSelected = themeId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]'
                  : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
              style={{ backgroundColor: t.card }}
            >
              <div className="space-y-2">
                {/* Header: Name and Active Check */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold tracking-tight truncate"
                    style={{ color: t.foreground }}
                  >
                    {t.name}
                  </span>
                  {isSelected && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: t.accent }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Preview Swatches */}
                <div
                  className="p-2.5 rounded-xl border flex flex-col gap-1.5"
                  style={{
                    backgroundColor: t.background,
                    borderColor: t.border,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.foreground }}
                    />
                  </div>
                  <div
                    className="text-[10px] truncate font-medium opacity-80"
                    style={{ color: t.foreground, fontFamily: t.fontFamily }}
                  >
                    The quick brown fox
                  </div>
                </div>
              </div>

              {/* Caption */}
              <p
                className="text-[10px] mt-2 line-clamp-1 opacity-70"
                style={{ color: t.foreground }}
              >
                {t.description}
              </p>
            </div>
          );
        })}

        {/* Custom Theme Card Pinned as Final Card in Grid */}
        <div
          key="custom"
          onClick={() => {
            setTheme('custom');
            setShowCustomWizard(true);
          }}
          className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
            themeId === 'custom'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]'
              : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
          style={{ backgroundColor: activeCustomTheme.card }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Sliders className="w-3.5 h-3.5 text-purple-500" />
                <span
                  className="text-xs font-bold tracking-tight truncate"
                  style={{ color: activeCustomTheme.foreground }}
                >
                  {activeCustomTheme.name || 'Custom Theme'}
                </span>
              </div>
              {themeId === 'custom' && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: activeCustomTheme.accent }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <div
              className="p-2.5 rounded-xl border flex flex-col gap-1.5 relative overflow-hidden"
              style={{
                backgroundColor: activeCustomTheme.background,
                borderColor: activeCustomTheme.border,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeCustomTheme.accent }}
                />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeCustomTheme.primary }}
                />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeCustomTheme.foreground }}
                />
              </div>
              <div
                className="text-[10px] truncate font-medium opacity-80"
                style={{
                  color: activeCustomTheme.foreground,
                  fontFamily: activeCustomTheme.fontFamily,
                }}
              >
                Custom typography &amp; background
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
              Pinned Custom Slot
            </span>
            <span className="text-[10px] text-indigo-500 hover:underline">
              Configure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
