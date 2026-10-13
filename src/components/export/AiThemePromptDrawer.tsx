'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  KeyRound,
  FileCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { generateJinjaThemeWithGemini } from '@/src/lib/export/geminiTemplateGenerator';
import {
  findVaultTemplate,
  saveVaultTemplate,
} from '@/src/lib/storage/repositories/noteRepository';
import { db } from '@/src/lib/storage/db';

export interface AiThemePromptDrawerProps {
  workspaceId: string;
  folderPath?: string;
  isMultiPage?: boolean;
  onTemplateGenerated?: (templateContent: string, templatePath: string) => void;
  onOpenTemplateInWorkspace?: (templatePath: string) => void;
  showToast?: (message: string) => void;
}

const PRESETS = [
  {
    title: 'Cyberpunk Glass',
    prompt:
      'Ultra-dark frosted glassmorphism with glowing cyan and neon magenta accents, futuristic monospace headings, and sleek backlit code cards.',
  },
  {
    title: 'Japanese Minimalist',
    prompt:
      'Warm off-white and charcoal ink tones, traditional Japanese wabi-sabi editorial layout, elegant serif typography, and generous calm whitespace.',
  },
  {
    title: 'Nordic Clean Light',
    prompt:
      'Scandinavian minimalist light theme with soft slate-blue accents, rounded cards, airy vertical rhythm, and modern sans-serif typography.',
  },
  {
    title: 'Obsidian High-Contrast',
    prompt:
      'Deep void black background with high-contrast emerald green accents, sharp border lines, and polished callout blocks.',
  },
];

export function AiThemePromptDrawer({
  workspaceId,
  folderPath,
  isMultiPage,
  onTemplateGenerated,
  onOpenTemplateInWorkspace,
  showToast,
}: AiThemePromptDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-gemini-api-key') || '' : ''
  );
  const [saveToWorkspace, setSaveToWorkspace] = useState(true);
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [saveAsTemplateFile, setSaveAsTemplateFile] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);
  const [existingTemplatePath, setExistingTemplatePath] = useState<string | null>(null);

  // Inspect directory for existing _template.html
  useEffect(() => {
    findVaultTemplate(workspaceId || 'default-vault', folderPath)
      .then((existing) => {
        if (existing) setExistingTemplatePath(existing.path);
        else setExistingTemplatePath(null);
      })
      .catch(console.error);
  }, [workspaceId, folderPath]);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Please provide your Gemini API key to generate a theme.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a theme style prompt.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      if (saveToWorkspace && typeof window !== 'undefined') {
        localStorage.setItem('caffeinemd-gemini-api-key', apiKey.trim());
        if (workspaceId) {
          db.workspaces.update(workspaceId, { geminiApiKey: apiKey.trim() }).catch(() => {});
        }
      }

      const generatedTemplate = await generateJinjaThemeWithGemini({
        apiKey: apiKey.trim(),
        prompt: prompt.trim(),
        isMultiPage,
      });

      let targetPath = '';
      if (saveAsTemplateFile) {
        const savedNote = await saveVaultTemplate(
          workspaceId || 'default-vault',
          folderPath || '',
          generatedTemplate
        );
        targetPath = savedNote.path;
        setGeneratedPath(savedNote.path);
        setExistingTemplatePath(savedNote.path);
      }

      if (onTemplateGenerated) {
        onTemplateGenerated(generatedTemplate, targetPath);
      }
      showToast?.('AI Jinja theme generated & compiled successfully!');
    } catch (err: any) {
      console.error('Theme generation failed:', err);
      setError(err?.message || 'Failed to generate theme with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden text-xs">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--card)]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)]">
              AI Theme Studio (Gemini BYOK)
            </span>
            <span className="text-[11px] text-neutral-400 block">
              Generate custom Jinja HTML templates with live Gemini prompting
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingTemplatePath && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Template
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3.5 border-t border-[var(--border)] space-y-3 bg-[var(--card)]/40">
          {/* Active Template Notice */}
          {existingTemplatePath && (
            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-neutral-300 truncate">
                  Using vault template: <code className="text-emerald-400 font-mono">{existingTemplatePath}</code>
                </span>
              </div>
              {onOpenTemplateInWorkspace && (
                <button
                  type="button"
                  onClick={() => onOpenTemplateInWorkspace(existingTemplatePath)}
                  className="px-2 py-1 rounded bg-[var(--background)] hover:bg-[var(--card)] border border-[var(--border)] text-[11px] text-[var(--accent)] shrink-0 font-medium cursor-pointer"
                >
                  Edit in Workspace
                </button>
              )}
            </div>
          )}

          {/* API Key Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-neutral-400" /> Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
            />
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToWorkspace}
                onChange={(e) => setSaveToWorkspace(e.target.checked)}
                className="rounded accent-[var(--accent)] cursor-pointer"
              />
              <span>Remember API Key in this browser</span>
            </label>
          </div>

          {/* Style Prompt Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-300">Style Presets</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setPrompt(p.prompt)}
                  className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer text-[11px] ${
                    prompt === p.prompt
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--background)] text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  <span className="font-medium block">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Textarea */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-300">Theme Prompt</label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe styling, fonts, colors, borders, and vibe..."
              className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          {/* Save to Vault Checkbox */}
          <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveAsTemplateFile}
              onChange={(e) => setSaveAsTemplateFile(e.target.checked)}
              className="rounded accent-[var(--accent)] cursor-pointer"
            />
            <span>
              Save as <code className="text-purple-400 font-mono">_template.html</code> in directory for future editing
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {generatedPath && onOpenTemplateInWorkspace ? (
              <button
                type="button"
                onClick={() => onOpenTemplateInWorkspace(generatedPath)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs text-purple-400 font-medium cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Edit {generatedPath} in Workspace</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Theme...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Gorgeous Theme</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
