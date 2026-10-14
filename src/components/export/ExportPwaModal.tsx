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
  triggerBrowserDownload,
} from '@/src/lib/export/exportBundleService';
import { getNotesByWorkspace } from '@/src/lib/storage/repositories/noteRepository';
import { DirectHtmlNote } from '@/src/lib/export/directHtmlExporter';
import {
  Download,
  X,
  Loader2,
  Settings2,
  Eye,
} from 'lucide-react';
import { DeploymentActionDrawer } from './DeploymentActionDrawer';
import { AiThemePromptDrawer } from './AiThemePromptDrawer';
import { ExportPreviewDrawer } from './ExportPreviewDrawer';
import { ExportOptionsForm } from './ExportOptionsForm';
import { compileExportPreviewHtml } from '@/src/lib/export/exportPreviewCompiler';
import { ModalShell } from '@/src/components/common/ModalShell';

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
  const [mobileActiveTab, setMobileActiveTab] = useState<'configure' | 'preview'>('configure');

  // Direct AI Synthesis states
  const [directHtmlMode, setDirectHtmlMode] = useState(false);
  const [directGeneratedHtml, setDirectGeneratedHtml] = useState<string | null>(null);

  // Live preview compilation state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleSetDirectHtmlMode = React.useCallback((enabled: boolean) => {
    setDirectHtmlMode(enabled);
    if (!enabled && directGeneratedHtml) {
      setDirectGeneratedHtml(null);
    }
  }, [directGeneratedHtml]);

  const collectScopedNotes = React.useCallback(async (): Promise<DirectHtmlNote[]> => {
    if (scopeMode === 'directory') {
      const allNotes = await getNotesByWorkspace(activeWorkspaceId);
      const normalizedFolder = normalizeFolderPath(exportModalTarget?.folderPath);
      const folderNotes = allNotes.filter((note) => {
        if (!note.path || note.isTrash || note.isBinary) return false;
        if (!normalizedFolder) return true;
        const normalizedNotePath = note.path.replace(/^\/+/, '');
        return (
          normalizedNotePath.startsWith(normalizedFolder + '/') ||
          normalizedNotePath === normalizedFolder
        );
      });

      if (folderNotes.length === 0) {
        const fallback = activeNote || createFallbackNote(appName, activeWorkspaceId || 'default-vault');
        return [{
          title: fallback.title || fallback.name.replace(/\.[^/.]+$/, ''),
          content: fallback.content || '',
          path: fallback.path,
        }];
      }

      return folderNotes.map((n) => ({
        title: n.title || n.name.replace(/\.[^/.]+$/, ''),
        content: n.content || '',
        path: n.path,
      }));
    } else {
      const targetNote = activeNote || createFallbackNote(appName, activeWorkspaceId || 'default-vault');
      return [{
        title: targetNote.title || targetNote.name.replace(/\.[^/.]+$/, ''),
        content: targetNote.content || '',
        path: targetNote.path,
      }];
    }
  }, [scopeMode, activeWorkspaceId, exportModalTarget?.folderPath, activeNote, appName]);

  useEffect(() => {
    if (directGeneratedHtml) {
      return;
    }
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
    directGeneratedHtml,
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
      if (outputType === 'html' && directGeneratedHtml) {
        const blob = new Blob([directGeneratedHtml], { type: 'text/html;charset=utf-8' });
        triggerBrowserDownload(blob, `${slugify(appName)}.html`);
        showToast('Direct Monolithic HTML exported successfully');
        closeExportModal();
        return;
      }

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
    <ModalShell
      isOpen={true}
      onClose={closeExportModal}
      size="xl"
      className="max-w-6xl max-h-[92vh] flex flex-col p-4 sm:p-6"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Export Document & PWA</h2>
            <p className="text-xs text-neutral-400">Export standalone HTML or production PWA app</p>
          </div>
        </div>
      }
      footer={
        <div className={`flex items-center justify-end gap-2 w-full ${mobileActiveTab === 'configure' ? 'flex' : 'hidden md:flex'}`}>
          <button type="button" onClick={closeExportModal} className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleDownload} disabled={isExporting} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            {isExporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Exporting...</span></> : <><Download className="w-3.5 h-3.5" /><span>{outputType === 'html' ? 'Download HTML' : 'Download PWA Bundle'}</span></>}
          </button>
        </div>
      }
    >

        {/* Mobile 2-Tab Segmented Switcher (Visible on < md) */}
        <div className="flex md:hidden border-b border-slate-800/80 bg-slate-950/60 p-1.5 gap-1.5 shrink-0 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setMobileActiveTab('configure')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mobileActiveTab === 'configure'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Export</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mobileActiveTab === 'preview'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Main Split Layout: Options Panel (Left) & Sandboxed Preview Drawer (Right) */}
        <div className="flex flex-col md:grid md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Options Column */}
          <div
            className={`${
              mobileActiveTab === 'configure' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
            } md:col-span-6 space-y-4`}
          >
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
              directHtmlMode={directHtmlMode}
              setDirectHtmlMode={handleSetDirectHtmlMode}
            />

            {/* AI Theme Studio (Gemini BYOK) Accordion */}
            <AiThemePromptDrawer
              workspaceId={activeWorkspaceId || 'default-vault'}
              folderPath={exportModalTarget?.folderPath}
              isMultiPage={scopeMode === 'directory'}
              outputType={outputType}
              directHtmlMode={directHtmlMode}
              setDirectHtmlMode={handleSetDirectHtmlMode}
              collectNotes={collectScopedNotes}
              folderName={appName}
              onDirectHtmlGenerated={(html) => {
                setDirectGeneratedHtml(html);
                setPreviewHtml(html);
              }}
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
          <div
            className={`${
              mobileActiveTab === 'preview' ? 'flex flex-col flex-1 w-full' : 'hidden md:flex md:flex-col'
            } md:col-span-6 h-[450px] md:h-auto min-h-[350px]`}
          >
            <ExportPreviewDrawer
              compiledHtml={previewHtml}
              isLoading={isPreviewLoading}
              appName={appName}
            />
          </div>
        </div>

    </ModalShell>
  );
}

export function ExportPwaModal() {
  const isExportModalOpen = useWorkspaceStore((s) => s.isExportModalOpen);
  if (!isExportModalOpen) return null;
  return <ExportPwaDialog />;
}
