import React from 'react';
import { Layers, Package, Palette, FileCode, Smartphone, Sparkles } from 'lucide-react';
import { THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { VaultFile } from '@/src/lib/storage/db';
import { normalizeFolderPath } from '@/src/lib/export/exportBundleService';

export interface ExportOptionsFormProps {
  scopeMode: 'single' | 'directory';
  setScopeMode: (s: 'single' | 'directory') => void;
  outputType: 'html' | 'pwa';
  setOutputType: (t: 'html' | 'pwa') => void;
  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;
  includeThemeSwitcher: boolean;
  setIncludeThemeSwitcher: (v: boolean) => void;
  appName: string;
  setAppName: (n: string) => void;
  appId: string;
  setAppId: (id: string) => void;
  activeNote: VaultFile | null;
  folderPath?: string;
  directHtmlMode?: boolean;
  setDirectHtmlMode?: (v: boolean) => void;
}

export function ExportOptionsForm({
  scopeMode,
  setScopeMode,
  outputType,
  setOutputType,
  selectedThemeId,
  setSelectedThemeId,
  includeThemeSwitcher,
  setIncludeThemeSwitcher,
  appName,
  setAppName,
  appId,
  setAppId,
  activeNote,
  folderPath,
  directHtmlMode = false,
  setDirectHtmlMode,
}: ExportOptionsFormProps) {
  return (
    <div className="space-y-4">
      {/* Scope selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Export Scope
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScopeMode('single')}
            className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
              scopeMode === 'single'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <div className="font-semibold mb-0.5">Current Note</div>
            <div className="text-[11px] opacity-75 truncate">{activeNote?.title || 'Active Document'}</div>
          </button>
          <button
            type="button"
            onClick={() => setScopeMode('directory')}
            className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
              scopeMode === 'directory'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <div className="font-semibold mb-0.5">{folderPath ? 'Folder' : 'Entire Vault'}</div>
            <div className="text-[11px] opacity-75 truncate">
              {folderPath ? normalizeFolderPath(folderPath) : 'All IndexedDB Notes'}
            </div>
          </button>
        </div>
      </div>

      {/* Output format */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Output Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOutputType('html')}
            className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
              outputType === 'html'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-0.5">
              <FileCode className="w-3.5 h-3.5" /> Standalone HTML
            </div>
            <div className="text-[11px] opacity-75">
              {scopeMode === 'directory' ? 'Single multi-note SPA file' : 'Single self-contained .html file'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setOutputType('pwa')}
            className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
              outputType === 'pwa'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--background)] text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-0.5">
              <Smartphone className="w-3.5 h-3.5" /> Production PWA (.zip)
            </div>
            <div className="text-[11px] opacity-75">Service Worker & Capacitor ready</div>
          </button>
        </div>
      </div>

      {/* Direct AI App Synthesis (One-Shot HTML) Toggle */}
      {outputType === 'html' && setDirectHtmlMode && (
        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1 text-xs">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-[var(--foreground)]">
                Direct AI App Synthesis (One-Shot HTML)
              </span>
            </div>
            <input
              type="checkbox"
              checked={directHtmlMode}
              onChange={(e) => setDirectHtmlMode(e.target.checked)}
              className="rounded accent-purple-500 cursor-pointer"
            />
          </label>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Bypasses intermediate Jinja templating — prompts Gemini to synthesize a complete, interactive monolithic HTML application with zero content truncation.
          </p>
        </div>
      )}

      {/* Theme Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Theme Styling
          </label>
          <select
            value={selectedThemeId}
            onChange={(e) => setSelectedThemeId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {THEME_PRESETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Theme Features</label>
          <label className="flex items-center gap-2 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeThemeSwitcher}
              onChange={(e) => setIncludeThemeSwitcher(e.target.checked)}
              className="rounded accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-[11px]">Include Invert Theme Switcher</span>
          </label>
        </div>
      </div>

      {/* PWA Configuration (Only when outputType === 'pwa') */}
      {outputType === 'pwa' && (
        <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2 text-xs">
          <div className="font-semibold text-neutral-300 text-[11px] uppercase tracking-wider">
            PWABuilder & Capacitor Settings
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-neutral-400">App Name</span>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400">Capacitor App ID</span>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
