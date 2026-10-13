import { VaultFile } from '@/src/lib/storage/db';
import { getNotesByWorkspace } from '@/src/lib/storage/repositories/noteRepository';
import { buildStandaloneHtml, buildFolderStandaloneHtml } from './standaloneHtmlBuilder';
import { normalizeFolderPath, createFallbackNote } from './exportBundleService';

export interface PreviewCompilerParams {
  scopeMode: 'single' | 'directory';
  folderPath?: string;
  activeNote: VaultFile | null;
  activeWorkspaceId?: string;
  appName: string;
  selectedThemeId: string;
  includeThemeSwitcher: boolean;
  customTemplateString?: string;
}

export async function compileExportPreviewHtml(params: PreviewCompilerParams): Promise<string> {
  const {
    scopeMode,
    folderPath,
    activeNote,
    activeWorkspaceId,
    appName,
    selectedThemeId,
    includeThemeSwitcher,
    customTemplateString,
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

    if (folderNotes.length > 0) {
      const folderName = normalizedFolder.split('/').pop() || appName;
      return await buildFolderStandaloneHtml(folderNotes, {
        themeId: selectedThemeId,
        includeThemeSwitcher,
        appTitle: appName,
        folderName,
        isPwa: false,
        customTemplate: customTemplateString,
        workspaceId: activeWorkspaceId || 'default-vault',
        folderPath: normalizedFolder,
      });
    }
  }

  const targetNote = activeNote || createFallbackNote(appName, activeWorkspaceId || 'default-vault');
  return await buildStandaloneHtml(targetNote, {
    themeId: selectedThemeId,
    includeThemeSwitcher,
    appTitle: appName,
    isPwa: false,
    customTemplate: customTemplateString,
  });
}
