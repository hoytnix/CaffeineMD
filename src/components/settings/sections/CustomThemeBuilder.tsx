'use client';

import React, { useState } from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';

export interface CustomThemeBuilderProps {
  customTheme: ThemeDefinition;
  updateCustomTheme: (partial: Partial<ThemeDefinition>) => void;
  setTheme: (id: string) => void;
  showCustomWizard: boolean;
  setShowCustomWizard: (show: boolean) => void;
}

const COLOR_FIELDS: { label: string; key: keyof ThemeDefinition }[] = [
  { label: 'Background Color', key: 'background' },
  { label: 'Card Container Color', key: 'card' },
  { label: 'Accent Color', key: 'accent' },
  { label: 'Text / Foreground', key: 'foreground' },
];

export function CustomThemeBuilder({
  customTheme,
  updateCustomTheme,
  setTheme,
  showCustomWizard,
  setShowCustomWizard,
}: CustomThemeBuilderProps) {
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [aiThemeError, setAiThemeError] = useState<string | null>(null);

  const handleGenerateAiTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibePrompt.trim()) return;

    setIsGeneratingTheme(true);
    setAiThemeError(null);

    try {
      const res = await fetch('/api/theme/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: vibePrompt }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate theme');
      }

      const generated = await res.json();
      const newCustom: Partial<ThemeDefinition> = {
        name: generated.name || 'AI Generated Theme',
        description: `Theme generated for vibe: "${vibePrompt}"`,
        background: generated.background,
        foreground: generated.foreground,
        card: generated.card,
        border: generated.border,
        accent: generated.accent,
        primary: generated.primary || generated.accent,
        fontFamily: generated.fontFamily || 'system-ui, sans-serif',
        fontFamilyGoogleUrl: generated.fontFamilyGoogleUrl,
        backgroundImageUrl: generated.backgroundImageUrl || '',
        isDark: true,
        syntaxBg: generated.card || '#1c1c26',
        syntaxKeyword: generated.accent || '#c084fc',
        syntaxString: '#a7f3d0',
        syntaxFunction: generated.primary || '#60a5fa',
        syntaxComment: '#71717a',
        syntaxVariable: generated.foreground || '#f472b6',
        syntaxNumber: '#fb923c',
        syntaxOperator: generated.accent || '#818cf8',
      };

      updateCustomTheme(newCustom);
      setTheme('custom');
      setShowCustomWizard(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Theme generation failed';
      setAiThemeError(message);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Theme Studio Generator */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              AI Theme Studio
            </span>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              Generate tailored high-contrast color palettes powered by Gemini 3.5 Flash-Lite
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            Gemini 3.5 Flash-Lite
          </span>
        </div>

        <form
          onSubmit={handleGenerateAiTheme}
          className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 p-4 shadow-xs space-y-3"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Describe your theme vibe (e.g. 'Cyberpunk neon rain', 'Cozy 80s parchment library', 'Tokyo midnight synthwave')..."
              value={vibePrompt}
              onChange={(e) => setVibePrompt(e.target.value)}
              disabled={isGeneratingTheme}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-32"
            />
            <button
              type="submit"
              disabled={isGeneratingTheme || !vibePrompt.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTheme ? 'animate-spin' : ''}`} />
              <span>{isGeneratingTheme ? 'Designing...' : 'Generate'}</span>
            </button>
          </div>

          {aiThemeError && (
            <p className="text-xs text-red-500 dark:text-red-400">{aiThemeError}</p>
          )}
        </form>
      </div>

      {/* Custom Theme Inline Color & Backdrop Wizard */}
      {showCustomWizard && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Custom Theme Palette &amp; Backdrop Wizard
              </h3>
            </div>
            <button
              onClick={() => setShowCustomWizard(false)}
              className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {COLOR_FIELDS.map(({ label, key }) => (
              <div key={key}>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(customTheme[key] as string) || '#000000'}
                    onChange={(e) => updateCustomTheme({ [key]: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={(customTheme[key] as string) || ''}
                    onChange={(e) => updateCustomTheme({ [key]: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Font Family
              </label>
              <select
                value={customTheme.fontFamily}
                onChange={(e) => updateCustomTheme({ fontFamily: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
              >
                <option value="system-ui, -apple-system, sans-serif">System Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'Outfit', sans-serif">Outfit</option>
                <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                Custom Ambient Backdrop Image URL
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={customTheme.backgroundImageUrl || ''}
                onChange={(e) => updateCustomTheme({ backgroundImageUrl: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
