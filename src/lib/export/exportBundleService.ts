import { VaultFile } from '@/src/lib/storage/db';
import { getNotesByWorkspace } from '@/src/lib/storage/repositories/noteRepository';
import { buildStandaloneHtml, buildFolderStandaloneHtml } from './standaloneHtmlBuilder';
import { generatePwaZipBundle, slugify } from './pwaExporter';

export function normalizeFolderPath(path?: string): string {
  return (path || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
}

export function createFallbackNote(appName: string, workspaceId: string): VaultFile {
  const timestamp = Date.now();
  return {
    id: 'export-note',
    path: 'export.md',
    name: 'export.md',
    title: appName,
    extension: 'md',
    content: `# ${appName}\n\nExported from CaffeineMD.`,
    frontmatter: {},
    tags: [],
    isBinary: false,
    size: 100,
    createdAt: timestamp,
    updatedAt: timestamp,
    vaultId: workspaceId || 'default-vault',
  };
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ExecuteExportParams {
  scopeMode: 'single' | 'directory';
  outputType: 'html' | 'pwa';
  folderPath?: string;
  activeNote: VaultFile | null;
  activeWorkspaceId?: string;
  appName: string;
  shortName: string;
  appId: string;
  selectedThemeId: string;
  includeThemeSwitcher: boolean;
  customTemplateString?: string;
  onToast: (msg: string) => void;
}

export async function executeExportDownload(params: ExecuteExportParams): Promise<boolean> {
  const {
    scopeMode,
    outputType,
    folderPath,
    activeNote,
    activeWorkspaceId,
    appName,
    shortName,
    appId,
    selectedThemeId,
    includeThemeSwitcher,
    customTemplateString,
    onToast,
  } = params;

  const normalizedFolder = normalizeFolderPath(folderPath);

  if (scopeMode === 'directory') {
    const allNotes = await getNotesByWorkspace(activeWorkspaceId);
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
      console.error(`No notes found matching folder path: "${normalizedFolder}"`);
      onToast(`No notes found in folder: "${normalizedFolder || 'vault'}"`);
      return false;
    }

    if (outputType === 'html') {
      const folderName = normalizedFolder.split('/').pop() || appName;
      const html = await buildFolderStandaloneHtml(folderNotes, {
        themeId: selectedThemeId,
        includeThemeSwitcher,
        appTitle: appName,
        folderName,
        isPwa: false,
        customTemplate: customTemplateString,
        workspaceId: activeWorkspaceId || 'default-vault',
        folderPath: normalizedFolder,
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      triggerBrowserDownload(blob, `${slugify(appName)}.html`);
      onToast('Folder exported as Standalone HTML');
    } else {
      const blob = await generatePwaZipBundle(folderNotes[0], {
        themeId: selectedThemeId,
        includeThemeSwitcher,
        appTitle: appName,
        isPwa: true,
        customTemplate: customTemplateString,
        scopeMode: 'directory',
        folderPath: normalizedFolder,
        workspaceId: activeWorkspaceId || 'default-vault',
        appName,
        shortName,
        appId,
      });

      triggerBrowserDownload(blob, `${slugify(appName)}-pwa.zip`);
      onToast('Production PWA bundle generated successfully');
    }
  } else {
    const targetNote: VaultFile =
      activeNote || createFallbackNote(appName, activeWorkspaceId || 'default-vault');

    if (outputType === 'html') {
      const html = await buildStandaloneHtml(targetNote, {
        themeId: selectedThemeId,
        includeThemeSwitcher,
        appTitle: appName,
        isPwa: false,
        customTemplate: customTemplateString,
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      triggerBrowserDownload(blob, `${slugify(appName)}.html`);
      onToast('Document exported as Standalone HTML');
    } else {
      const blob = await generatePwaZipBundle(targetNote, {
        themeId: selectedThemeId,
        includeThemeSwitcher,
        appTitle: appName,
        isPwa: true,
        customTemplate: customTemplateString,
        scopeMode: 'single',
        workspaceId: activeWorkspaceId || 'default-vault',
        appName,
        shortName,
        appId,
      });

      triggerBrowserDownload(blob, `${slugify(appName)}-pwa.zip`);
      onToast('Production PWA bundle generated successfully');
    }
  }
  return true;
}
