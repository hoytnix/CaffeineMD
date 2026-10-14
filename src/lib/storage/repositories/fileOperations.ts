import { db, VaultFile } from '../schema';
import { serializeMarkdownWithFrontmatter, parseMarkdownContent } from '../../markdown/frontmatter';
import { NativeFileSystemAdapter } from '../fileSystem';

/**
 * Rename a note or folder file path
 */
export async function renameVaultFile(
  oldPath: string,
  newPath: string,
  newTitle?: string
): Promise<{ success: boolean; error?: string }> {
  if (oldPath === newPath) return { success: true };

  const existingTarget = await db.files.get(newPath);
  if (existingTarget) {
    return { success: false, error: 'A file with this name or path already exists.' };
  }

  const file = await db.files.get(oldPath);
  if (!file) {
    return { success: false, error: 'File not found.' };
  }

  const resolvedTitle = newTitle || newPath.replace(/\.[^/.]+$/, '').split('/').pop() || newPath;
  const fileName = newPath.split('/').pop() || newPath;
  const ext = newPath.split('.').pop() || file.extension;

  let updatedContent = file.content;
  let updatedFrontmatter = { ...file.frontmatter };

  if (!file.isBinary) {
    updatedFrontmatter.title = resolvedTitle;
    const parsed = parseMarkdownContent(file.content, resolvedTitle);
    updatedContent = serializeMarkdownWithFrontmatter(parsed.body, updatedFrontmatter);
  }

  const updatedFile: VaultFile = {
    ...file,
    id: newPath,
    path: newPath,
    name: fileName,
    title: resolvedTitle,
    extension: ext,
    content: updatedContent,
    frontmatter: updatedFrontmatter,
    updatedAt: Date.now(),
  };

  await db.transaction('rw', [db.files, db.backlinks], async () => {
    await db.files.delete(oldPath);
    if (file.id && file.id !== oldPath) {
      await db.files.delete(file.id);
    }
    await db.files.put(updatedFile);

    // Update backlinks pointing to this source
    await db.backlinks.where('sourcePath').equals(oldPath).modify({
      sourcePath: newPath,
      sourceTitle: resolvedTitle,
    });
  });

  // Handle disk rename if mounted
  try {
    await NativeFileSystemAdapter.createNewFileOnDisk(newPath, updatedContent);
    await NativeFileSystemAdapter.removeFileFromDisk(oldPath);
  } catch (err) {
    console.warn('Could not mirror rename to local disk handle:', err);
  }

  return { success: true };
}

/**
 * Duplicate a note with incremented title and copy suffix in the same directory
 */
export async function duplicateVaultFile(path: string): Promise<{ success: boolean; newPath?: string; error?: string }> {
  const file = await db.files.get(path);
  if (!file) {
    return { success: false, error: 'File not found.' };
  }

  const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
  const baseNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.extension ? `.${file.extension}` : '';

  // Find non-colliding title and path
  let counter = 1;
  let candidateTitle = `${file.title || baseNameWithoutExt} (copy)`;
  let candidateFileName = `${baseNameWithoutExt} (copy)${ext}`;
  let candidatePath = dir ? `${dir}/${candidateFileName}` : candidateFileName;

  while (await db.files.get(candidatePath)) {
    counter++;
    candidateTitle = `${file.title || baseNameWithoutExt} (copy ${counter})`;
    candidateFileName = `${baseNameWithoutExt} (copy ${counter})${ext}`;
    candidatePath = dir ? `${dir}/${candidateFileName}` : candidateFileName;
  }

  let updatedContent = file.content;
  let updatedFrontmatter = { ...file.frontmatter };

  if (!file.isBinary) {
    updatedFrontmatter.title = candidateTitle;
    const parsed = parseMarkdownContent(file.content, candidateTitle);
    updatedContent = serializeMarkdownWithFrontmatter(parsed.body, updatedFrontmatter);
  }

  const duplicatedFile: VaultFile = {
    ...file,
    id: candidatePath,
    path: candidatePath,
    name: candidateFileName,
    title: candidateTitle,
    content: updatedContent,
    frontmatter: updatedFrontmatter,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isTrash: false,
    deletedAt: undefined,
  };

  await db.files.put(duplicatedFile);

  try {
    await NativeFileSystemAdapter.createNewFileOnDisk(candidatePath, updatedContent);
  } catch (err) {
    console.warn('Could not mirror duplicate to local disk handle:', err);
  }

  return { success: true, newPath: candidatePath };
}

/**
 * Move a note to a new destination folder directory
 */
export async function moveVaultFile(
  oldPath: string,
  targetFolder: string
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  const file = await db.files.get(oldPath);
  if (!file) {
    return { success: false, error: 'File not found.' };
  }

  const cleanFolder = targetFolder.trim().replace(/^\/+|\/+$/g, '');
  const fileName = file.name;
  const newPath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  if (newPath === oldPath) {
    return { success: true, newPath: oldPath };
  }

  const existingTarget = await db.files.get(newPath);
  if (existingTarget) {
    return { success: false, error: `File "${fileName}" already exists in "${cleanFolder || 'root'}".` };
  }

  const movedFile: VaultFile = {
    ...file,
    id: newPath,
    path: newPath,
    updatedAt: Date.now(),
  };

  await db.transaction('rw', [db.files, db.backlinks], async () => {
    await db.files.delete(oldPath);
    if (file.id && file.id !== oldPath) {
      await db.files.delete(file.id);
    }
    await db.files.put(movedFile);

    await db.backlinks.where('sourcePath').equals(oldPath).modify({
      sourcePath: newPath,
    });
  });

  try {
    await NativeFileSystemAdapter.createNewFileOnDisk(newPath, file.content);
    await NativeFileSystemAdapter.removeFileFromDisk(oldPath);
  } catch (err) {
    console.warn('Could not mirror move to local disk handle:', err);
  }

  return { success: true, newPath };
}

/**
 * Soft delete an entire folder and all its nested notes
 */
export async function softDeleteFolder(folderPath: string, workspaceId?: string): Promise<string[]> {
  const normalized = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return [];

  const allNotes = await db.notes.toArray();
  const matchingNotes = allNotes.filter((n) => {
    if (n.isTrash || n.isDeleted) return false;
    if (workspaceId && workspaceId !== 'default-vault' && n.vaultId !== workspaceId) return false;
    if (workspaceId === 'default-vault' && n.vaultId && n.vaultId !== 'default-vault') return false;

    const pathMatches = n.path === normalized || n.path.startsWith(normalized + '/');
    const folderMatches = Boolean(n.folder && (n.folder === normalized || n.folder.startsWith(normalized + '/')));
    return pathMatches || folderMatches;
  });

  const now = Date.now();
  const deletedIds: string[] = [];

  await db.transaction('rw', [db.files, db.backlinks], async () => {
    for (const note of matchingNotes) {
      const noteId = note.id || note.path;
      await db.files.update(noteId, {
        isTrash: true,
        isDeleted: true,
        deletedAt: now,
        updatedAt: now,
        originalPath: note.path,
      });
      deletedIds.push(noteId);
    }
  });

  return deletedIds;
}

/**
 * Soft delete a note or folder by ID
 */
export async function softDeleteNote(id: string, workspaceId?: string): Promise<boolean> {
  if (id.startsWith('folder:')) {
    const deletedIds = await softDeleteFolder(id.slice('folder:'.length), workspaceId);
    return deletedIds.length >= 0;
  }

  const file = await db.notes.get(id);
  if (!file) {
    const folderDeletedIds = await softDeleteFolder(id, workspaceId);
    if (folderDeletedIds.length > 0) return true;
    throw new Error(`Note not found: ${id}`);
  }

  const now = Date.now();
  await db.notes.update(file.id || file.path, {
    isTrash: true,
    isDeleted: true,
    deletedAt: now,
    updatedAt: now,
    originalPath: file.path,
  });

  return true;
}

/**
 * Rename a folder and recursively update paths for all nested notes
 */
export async function renameFolder(
  oldFolderPath: string,
  newFolderName: string,
  workspaceId?: string
): Promise<void> {
  const cleanOld = oldFolderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  const cleanNewName = newFolderName.trim().replace(/^\/+|\/+$/g, '');
  if (!cleanOld || !cleanNewName) return;

  const parentDir = cleanOld.includes('/') ? cleanOld.substring(0, cleanOld.lastIndexOf('/')) : '';
  const newFolderPath = parentDir ? `${parentDir}/${cleanNewName}` : cleanNewName;
  if (cleanOld === newFolderPath) return;

  const allNotes = await db.notes.toArray();
  const matchingNotes = allNotes.filter((n) => {
    if (workspaceId && workspaceId !== 'default-vault' && n.vaultId !== workspaceId) return false;
    if (workspaceId === 'default-vault' && n.vaultId && n.vaultId !== 'default-vault') return false;
    return n.path === cleanOld || n.path.startsWith(cleanOld + '/');
  });

  await db.transaction('rw', [db.files, db.backlinks], async () => {
    for (const note of matchingNotes) {
      const rest = note.path === cleanOld ? '' : note.path.substring(cleanOld.length + 1);
      const newPath = rest ? `${newFolderPath}/${rest}` : newFolderPath;
      const newFolder = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
      const newName = newPath.split('/').pop() || newPath;

      const updatedNote: VaultFile = {
        ...note,
        id: newPath,
        path: newPath,
        name: newName,
        folder: newFolder,
        updatedAt: Date.now(),
      };

      await db.files.delete(note.id || note.path);
      await db.files.put(updatedNote);

      await db.backlinks.where('sourcePath').equals(note.path).modify({
        sourcePath: newPath,
      });

      try {
        await NativeFileSystemAdapter.createNewFileOnDisk(newPath, note.content);
        await NativeFileSystemAdapter.removeFileFromDisk(note.path);
      } catch (err) {
        console.warn('Could not mirror rename to local disk:', err);
      }
    }
  });
}

/**
 * Move a folder and recursively update paths for all nested notes
 */
export async function moveFolder(
  sourceFolderPath: string,
  targetParentFolder: string,
  workspaceId?: string
): Promise<void> {
  const cleanSource = sourceFolderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  const cleanTargetParent = targetParentFolder.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  if (!cleanSource) return;

  const folderBaseName = cleanSource.split('/').pop() || cleanSource;
  const newFolderPath = cleanTargetParent ? `${cleanTargetParent}/${folderBaseName}` : folderBaseName;
  if (cleanSource === newFolderPath) return;

  const allNotes = await db.notes.toArray();
  const matchingNotes = allNotes.filter((n) => {
    if (workspaceId && workspaceId !== 'default-vault' && n.vaultId !== workspaceId) return false;
    if (workspaceId === 'default-vault' && n.vaultId && n.vaultId !== 'default-vault') return false;
    return n.path === cleanSource || n.path.startsWith(cleanSource + '/');
  });

  await db.transaction('rw', [db.files, db.backlinks], async () => {
    for (const note of matchingNotes) {
      const rest = note.path === cleanSource ? '' : note.path.substring(cleanSource.length + 1);
      const newPath = rest ? `${newFolderPath}/${rest}` : newFolderPath;
      const newFolder = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
      const newName = newPath.split('/').pop() || newPath;

      const updatedNote: VaultFile = {
        ...note,
        id: newPath,
        path: newPath,
        name: newName,
        folder: newFolder,
        updatedAt: Date.now(),
      };

      await db.files.delete(note.id || note.path);
      await db.files.put(updatedNote);

      await db.backlinks.where('sourcePath').equals(note.path).modify({
        sourcePath: newPath,
      });

      try {
        await NativeFileSystemAdapter.createNewFileOnDisk(newPath, note.content);
        await NativeFileSystemAdapter.removeFileFromDisk(note.path);
      } catch (err) {
        console.warn('Could not mirror move to local disk:', err);
      }
    }
  });
}

export { permanentlyDeleteNote, emptyTrash } from './noteRepository';
