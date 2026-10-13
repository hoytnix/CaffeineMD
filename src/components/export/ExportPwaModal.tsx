'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { db, VaultFile } from '@/src/lib/storage/db';
import { THEME_PRESETS as _THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { slugify } from '@/src/lib/export/pwaExporter';
import {
  normalizeFolderPath,
  createFallbackNote,
  executeExportDownload,
} from '@/src/lib/export/exportBundleService';
import {
  Download,
  X,
  Loader2,
} from 'lucide-react';
import { DeploymentActionDrawer } from './DeploymentActionDrawer';
import { AiThemePromptDrawer } from './AiThemePromptDrawer';
import { ExportPreviewDrawer } from './ExportPreviewDrawer';
import { ExportOptionsForm } from './ExportOptionsForm';
import { compileExportPreviewHtml } from '@/src/lib/export/exportPreviewCompiler';

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

  // Live preview compilation state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setIsPreviewLoading(true);
      compileExportPreviewHtml({
        scopeMode,
        folderPath: exportModalTarget?.folderPath,
        activeNote,
        activeWorkspaceId,
        appName,
        selectedThemeId,
        includeThemeSwitcher,
        customTemplateString,
      })
        .then((html) => {
          if (!cancelled) setPreviewHtml(html);
        })
        .catch((err) => {
          console.warn('Preview compilation error:', err);
        })
        .finally(() => {
          if (!cancelled) setIsPreviewLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    scopeMode,
    exportModalTarget?.folderPath,
    activeNote,
    activeWorkspaceId,
    appName,
    selectedThemeId,
    includeThemeSwitcher,
    customTemplateString,
  ]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeExportModal}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 sm:p-6 text-[var(--foreground)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 shrink-0">
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

        {/* Main Split Layout: Options Panel (Left) & Sandboxed Preview Drawer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Options Column */}
          <div className="lg:col-span-6 space-y-4">
            <ExportOptionsForm
              scopeMode={scopeMode}
              setScopeMode={setScopeMode}
              outputType={outputType}
              setOutputType={setOutputType}
              selectedThemeId={selectedThemeId}
              setSelectedThemeId={setSelectedThemeId}
              includeThemeSwitcher={includeThemeSwitcher}
              setIncludeThemeSwitcher={setIncludeThemeSwitcher}
              appName={appName}
              setAppName={setAppName}
              appId={appId}
              setAppId={setAppId}
              activeNote={activeNote}
              folderPath={exportModalTarget?.folderPath}
            />

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
          </div>

          {/* Sandboxed Live Preview Column */}
          <div className="lg:col-span-6 h-[380px] lg:h-auto min-h-[350px] flex flex-col">
            <ExportPreviewDrawer
              compiledHtml={previewHtml}
              isLoading={isPreviewLoading}
              appName={appName}
            />
          </div>
        </div>

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
