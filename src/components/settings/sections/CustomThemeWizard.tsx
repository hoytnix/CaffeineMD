'use client';

import React from 'react';
import { Sliders } from 'lucide-react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export interface CustomThemeWizardProps {
  customTheme: ThemeDefinition;
  updateCustomTheme: (partial: Partial<ThemeDefinition>) => void;
  showCustomWizard: boolean;
  setShowCustomWizard: (show: boolean) => void;
}

const COLOR_FIELDS: { label: string; key: keyof ThemeDefinition }[] = [
  { label: 'Background Color', key: 'background' },
  { label: 'Card Container Color', key: 'card' },
  { label: 'Accent Color', key: 'accent' },
  { label: 'Text / Foreground', key: 'foreground' },
];

export function CustomThemeWizard({
  customTheme,
  updateCustomTheme,
  showCustomWizard,
  setShowCustomWizard,
}: CustomThemeWizardProps) {
  const setEditorFontFamily = useWorkspaceStore((s) => s.setEditorFontFamily);

  if (!showCustomWizard) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Custom Theme Palette &amp; Backdrop Wizard
          </h3>
        </div>
        <button
          onClick={() => setShowCustomWizard(false)}
          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {COLOR_FIELDS.map(({ label, key }) => (
          <div key={key}>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(customTheme[key] as string) || '#000000'}
                onChange={(e) => updateCustomTheme({ [key]: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-700/60 bg-transparent"
              />
              <input
                type="text"
                value={(customTheme[key] as string) || ''}
                onChange={(e) => updateCustomTheme({ [key]: e.target.value })}
                className="w-full text-xs font-mono px-2 py-1 rounded bg-slate-950/60 border border-slate-700/60 text-slate-200"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Font Family
          </label>
          <select
            value={customTheme.fontFamily}
            onChange={(e) => {
              const val = e.target.value;
              updateCustomTheme({ fontFamily: val });
              if (val.includes('JetBrains Mono') || val === 'mono') {
                setEditorFontFamily('mono');
              } else if (val.includes('Merriweather') || val === 'serif') {
                setEditorFontFamily('serif');
              } else {
                setEditorFontFamily('sans');
              }
            }}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/60 text-xs text-slate-200 outline-none"
          >
            <option value="Inter">Inter (Sans-Serif)</option>
            <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
            <option value="Merriweather">Merriweather (Serif)</option>
            <option value="system-ui, -apple-system, sans-serif">System Default</option>
            <option value="'Inter', sans-serif">Inter (CSS stack)</option>
            <option value="'JetBrains Mono', monospace">JetBrains Mono (CSS stack)</option>
            <option value="'Fira Code', monospace">Fira Code</option>
            <option value="'Outfit', sans-serif">Outfit</option>
            <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Custom Ambient Backdrop Image URL
          </label>
          <input
            type="text"
            placeholder="https://images.unsplash.com/..."
            value={customTheme.backgroundImageUrl || ''}
            onChange={(e) => updateCustomTheme({ backgroundImageUrl: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
