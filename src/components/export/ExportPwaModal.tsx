'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { db, VaultFile } from '@/src/lib/storage/db';
import { THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { slugify } from '@/src/lib/export/pwaExporter';
import {
  normalizeFolderPath,
  createFallbackNote,
  executeExportDownload,
} from '@/src/lib/export/exportBundleService';
import {
  Download,
  X,
  FileCode,
  Package,
  Layers,
  Palette,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { DeploymentActionDrawer } from './DeploymentActionDrawer';
import { AiThemePromptDrawer } from './AiThemePromptDrawer';

function ExportPwaDialog() {
  const {
    closeExportModal,
    exportModalTarget,
    activeFilePath,
    activeWorkspaceId,
    vaultName,
    themeId: currentThemeId,
    showToast,
    openFileTab,
  } = useWorkspaceStore();

  const [activeNote, setActiveNote] = useState<VaultFile | null>(null);
  const [scopeMode, setScopeMode] = useState<'single' | 'directory'>(() =>
    exportModalTarget?.folderPath ? 'directory' : 'single'
  );
  const [outputType, setOutputType] = useState<'html' | 'pwa'>('html');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => currentThemeId || 'dark');
  const [includeThemeSwitcher, setIncludeThemeSwitcher] = useState(true);
  const [customTemplateString, setCustomTemplateString] = useState<string | undefined>(undefined);
  const defaultTitle = React.useMemo(() => {
    if (exportModalTarget?.folderPath) {
      const norm = normalizeFolderPath(exportModalTarget.folderPath);
      return norm.split('/').pop() || 'CaffeineMD Vault';
    }
    return vaultName || 'CaffeineMD Export';
  }, [exportModalTarget, vaultName]);

  const [appName, setAppName] = useState(() => defaultTitle);
  const [shortName, setShortName] = useState(() => defaultTitle.slice(0, 12));
  const [appId, setAppId] = useState(() => `com.caffeinemd.${slugify(defaultTitle)}`);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const notePath = exportModalTarget?.targetNotePath || activeFilePath;
    if (notePath) {
      db.files.get(notePath).then((note) => {
        if (note) {
          setActiveNote(note);
          if (!exportModalTarget?.folderPath) {
            const title = note.title || note.name.replace(/\.[^/.]+$/, '');
            setAppName(title);
            setShortName(title.slice(0, 12));
            setAppId(`com.caffeinemd.${slugify(title)}`);
          }
        }
      }).catch(console.error);
    }
  }, [exportModalTarget, activeFilePath]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const success = await executeExportDownload({
        scopeMode,
        outputType,
        folderPath: exportModalTarget?.folderPath,
        activeNote,
        activeWorkspaceId,
        appName,
        shortName,
        appId,
        selectedThemeId,
        includeThemeSwitcher,
        customTemplateString,
        onToast: showToast,
      });

      if (success) {
        closeExportModal();
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(err?.message || 'Export generation failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeExportModal}
    >
      <div
        className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 sm:p-6 text-[var(--foreground)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Export Document & PWA</h2>
              <p className="text-xs text-neutral-400">Export standalone HTML or production PWA app</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeExportModal}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
              <div className="font-semibold mb-0.5">
                {exportModalTarget?.folderPath ? 'Folder' : 'Entire Vault'}
              </div>
              <div className="text-[11px] opacity-75 truncate">
                {exportModalTarget?.folderPath ? normalizeFolderPath(exportModalTarget.folderPath) : 'All IndexedDB Notes'}
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

        {/* AI Theme Studio (Gemini BYOK) Accordion */}
        <AiThemePromptDrawer
          workspaceId={activeWorkspaceId || 'default-vault'}
          folderPath={exportModalTarget?.folderPath}
          isMultiPage={scopeMode === 'directory'}
          onTemplateGenerated={(templateContent) => {
            setCustomTemplateString(templateContent);
          }}
          onOpenTemplateInWorkspace={(templatePath) => {
            openFileTab(templatePath, '_template.html');
            closeExportModal();
          }}
          showToast={showToast}
        />

        {/* 1-Click Cloud Deployment Action Drawer */}
        <DeploymentActionDrawer
          activeNote={
            activeNote || createFallbackNote(appName, activeWorkspaceId || 'default-vault')
          }
          bundleOptions={{
            themeId: selectedThemeId,
            includeThemeSwitcher,
            appTitle: appName,
            isPwa: true,
            customTemplate: customTemplateString,
            scopeMode,
            folderPath: exportModalTarget?.folderPath,
            workspaceId: activeWorkspaceId || 'default-vault',
            appName,
            shortName,
            appId,
          }}
          onToast={showToast}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={closeExportModal}
            className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{outputType === 'html' ? 'Download HTML' : 'Download PWA Bundle'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExportPwaModal() {
  const isExportModalOpen = useWorkspaceStore((s) => s.isExportModalOpen);
  if (!isExportModalOpen) return null;
  return <ExportPwaDialog />;
}
