'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { getGeminiApiKey } from '@/src/lib/export/geminiTemplateGenerator';
import { generateAiThemePalette } from '@/src/lib/themes/aiThemeService';

export interface AiThemeStudioCardProps {
  updateCustomTheme: (partial: Partial<ThemeDefinition>) => void;
  setTheme: (id: string) => void;
  setShowCustomWizard: (show: boolean) => void;
}

export function AiThemeStudioCard({
  updateCustomTheme,
  setTheme,
  setShowCustomWizard,
}: AiThemeStudioCardProps) {
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [aiThemeError, setAiThemeError] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState(() => getGeminiApiKey());

  useEffect(() => {
    const handleKeyUpdate = () => {
      setGeminiApiKey(getGeminiApiKey());
    };
    window.addEventListener('caffeinemd-gemini-key-updated', handleKeyUpdate);
    window.addEventListener('storage', handleKeyUpdate);
    return () => {
      window.removeEventListener('caffeinemd-gemini-key-updated', handleKeyUpdate);
      window.removeEventListener('storage', handleKeyUpdate);
    };
  }, []);

  const hasGeminiKey = Boolean(geminiApiKey?.trim());

  if (!hasGeminiKey) {
    return null;
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibePrompt.trim()) return;

    const apiKey = getGeminiApiKey()?.trim();
    if (!apiKey) {
      setAiThemeError('Gemini BYOK API key is required.');
      return;
    }

    setIsGeneratingTheme(true);
    setAiThemeError(null);

    try {
      const generated = await generateAiThemePalette(vibePrompt, apiKey);

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
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Theme Studio
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Generate tailored high-contrast color palettes powered by Gemini 3.5 Flash-Lite
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3" />
          Gemini 3.5 Flash-Lite
        </span>
      </div>

      <form
        onSubmit={handleGenerate}
        className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 shadow-xs space-y-3"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Describe your theme vibe (e.g. 'Cyberpunk neon rain', 'Cozy 80s parchment library', 'Tokyo midnight synthwave')..."
            value={vibePrompt}
            onChange={(e) => setVibePrompt(e.target.value)}
            disabled={isGeneratingTheme}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/60 text-xs text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-32"
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
          <p className="text-xs text-red-400">{aiThemeError}</p>
        )}
      </form>
    </div>
  );
}
