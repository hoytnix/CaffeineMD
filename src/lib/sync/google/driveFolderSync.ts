'use client';

import {
  createDriveFolder,
  deleteRemoteFile,
  fetchDriveFiles,
  moveOrRenameDriveFile,
  RemoteDriveFolder,
} from './driveApiClient';
import { getPendingFolderMoves, clearPendingFolderMoves } from '@/src/lib/storage/pendingMoves';

/**
 * Ensure a directory path exists on Google Drive, creating intermediate folders as needed.
 */
export async function ensureRemoteFolderPath(
  accessToken: string,
  rootFolderId: string,
  folderPath: string,
  cache = new Map<string, string>()
): Promise<string> {
  const clean = folderPath.trim().replace(/^\/+|\/+$/g, '');
  if (!clean) return rootFolderId;
  if (cache.has(clean)) return cache.get(clean)!;

  const segments = clean.split('/');
  let currentParentId = rootFolderId;
  let currentPath = '';

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    if (cache.has(currentPath)) {
      currentParentId = cache.get(currentPath)!;
      continue;
    }

    const q = `'${currentParentId}' in parents and name = '${segment.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await fetchDriveFiles(accessToken, q, 'files(id, name)');
    if (res.files && res.files.length > 0) {
      currentParentId = res.files[0].id;
    } else {
      currentParentId = await createDriveFolder(accessToken, segment, currentParentId);
    }
    cache.set(currentPath, currentParentId);
  }

  return currentParentId;
}

/**
 * Prune remote folders that have no non-trashed children remaining.
 */
export async function pruneEmptiedRemoteFolders(
  accessToken: string,
  folderIds: string[]
): Promise<void> {
  for (const folderId of folderIds) {
    if (!folderId) continue;
    try {
      const q = `'${folderId}' in parents and trashed = false`;
      const res = await fetchDriveFiles(accessToken, q, 'files(id)');
      if (!res.files || res.files.length === 0) {
        await deleteRemoteFile(folderId, accessToken);
      }
    } catch (err) {
      console.warn(`[driveFolderSync] Could not prune folder ${folderId}:`, err);
    }
  }
}

/**
 * Process pending folder moves by reparenting/renaming existing Drive folder nodes directly.
 * Returns a set of old folder paths that were atomically relocated on Google Drive.
 */
export async function syncPendingFolderMoves(
  accessToken: string,
  rootFolderId: string,
  crawledFolders: Map<string, RemoteDriveFolder>
): Promise<Set<string>> {
  const pending = await getPendingFolderMoves();
  const movedOldPaths = new Set<string>();
  if (pending.length === 0) return movedOldPaths;

  const folderCache = new Map<string, string>();
  for (const [path, folder] of crawledFolders.entries()) {
    folderCache.set(path, folder.id);
  }

  const prunedParents = new Set<string>();

  for (const { oldPath, newPath } of pending) {
    const remoteFolder = crawledFolders.get(oldPath);
    if (!remoteFolder) continue;

    const parentDir = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
    const newName = newPath.split('/').pop() || newPath;
    const targetParentId = parentDir
      ? await ensureRemoteFolderPath(accessToken, rootFolderId, parentDir, folderCache)
      : rootFolderId;

    try {
      await moveOrRenameDriveFile(accessToken, remoteFolder.id, {
        addParents: targetParentId,
        removeParents: remoteFolder.parentId,
        name: newName !== remoteFolder.name ? newName : undefined,
      });

      movedOldPaths.add(oldPath);
      if (remoteFolder.parentId && remoteFolder.parentId !== rootFolderId) {
        prunedParents.add(remoteFolder.parentId);
      }
    } catch (err) {
      console.warn(`[driveFolderSync] Failed to reparent folder node ${oldPath}:`, err);
    }
  }

  await clearPendingFolderMoves();
  if (prunedParents.size > 0) {
    await pruneEmptiedRemoteFolders(accessToken, Array.from(prunedParents));
  }

  return movedOldPaths;
}

/**
 * Move or reparent an existing remote note on Google Drive in-place without re-uploading.
 */
export async function moveRemoteNote(
  token: string,
  local: import('@/src/lib/storage/db').VaultFile,
  rootFolderId: string,
  action: import('./driveReconciler').DriveSyncAction,
  folderCache: Map<string, string>
): Promise<void> {
  const { db } = await import('@/src/lib/storage/db');
  const { getFileBlob } = await import('../syncExecutor');
  const { syncFileToDrive } = await import('./resumableChunkUploader');

  const fileId = action.remoteFileId || local.driveFileId || local.driveId;
  if (!fileId) return;

  const oldRemote = action.remote;
  const isFlat = oldRemote?.name.includes('___');
  const oldParentId = oldRemote?.parentId;
  const targetDir = local.path.includes('/') ? local.path.substring(0, local.path.lastIndexOf('/')) : '';
  const newFileName = local.path.split('/').pop() || local.path;
  const newDriveFileName = local.path.replace(/\//g, '___');

  if (isFlat) {
    await moveOrRenameDriveFile(token, fileId, { name: newDriveFileName });
  } else {
    const targetFolderId = targetDir
      ? await ensureRemoteFolderPath(token, rootFolderId, targetDir, folderCache)
      : rootFolderId;

    await moveOrRenameDriveFile(token, fileId, {
      addParents: targetFolderId !== oldParentId ? targetFolderId : undefined,
      removeParents: oldParentId && oldParentId !== targetFolderId ? oldParentId : undefined,
      name: newFileName,
    });

    if (oldParentId && oldParentId !== rootFolderId) {
      await pruneEmptiedRemoteFolders(token, [oldParentId]);
    }
  }

  const remoteTime = oldRemote
    ? typeof oldRemote.modifiedTime === 'number'
      ? oldRemote.modifiedTime
      : new Date(oldRemote.modifiedTime).getTime()
    : 0;

  if (local.updatedAt - remoteTime > 2000) {
    const fileBlob = getFileBlob(local);
    const metadata = {
      name: isFlat ? newDriveFileName : newFileName,
      mimeType: local.mimeType || fileBlob.type,
    };
    await syncFileToDrive(token, metadata, fileBlob, undefined, fileId);
  }

  if (local.id) {
    await db.files
      .update(local.id, {
        driveFileId: fileId,
        driveId: fileId,
        lastSyncedPath: local.path,
        previousPath: undefined,
        lastSyncedAt: Date.now(),
      })
      .catch(() => {});
  }
}

