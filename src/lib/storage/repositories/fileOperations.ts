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
