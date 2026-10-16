'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import {
  DriveSyncStatus,
  RemoteDriveFile,
  downloadRemoteFile,
  downloadRemoteBinary,
  trashRemoteFile,
  moveOrRenameDriveFile,
} from './driveApiClient';
import { DriveAuthService } from './driveAuthService';
import { crawlRemoteWorkspace } from './remoteCrawler';
import { reconcileDriveState, DriveSyncAction } from './driveReconciler';
import { syncFileToDrive } from './resumableChunkUploader';
import { getFileBlob } from '../syncExecutor';
import { getAllNotes, getTrashedNotes } from '@/src/lib/storage/repositories/noteRepository';
import { softDeleteNote } from '@/src/lib/storage/repositories/fileOperations';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { parseFrontmatter, normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import { SyncProgressState, syncProgressEmitter } from '../syncProgress';
import {
  syncPendingFolderMoves,
  ensureRemoteFolderPath,
  pruneEmptiedRemoteFolders,
  moveRemoteNote,
} from './driveFolderSync';

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);
const pdfExtensions = new Set(['pdf']);

export interface DriveSyncRunnerParams {
  token: string;
  folderId: string;
  workspaceName: string;
  currentWorkspaceId: string;
  onProgress?: (statusText: string) => void;
  onProgressState?: (state: SyncProgressState) => void;
}

/**
 * Pull a single remote note from Google Drive into Dexie.
 * Skips pulling if the note is soft-deleted locally to prevent resurrection.
 */
export async function pullRemoteNote(
  token: string,
  remote: RemoteDriveFile,
  workspaceId: string
): Promise<VaultFile | null> {
  const reconstructedPath = remote.relativePath.includes('___')
    ? remote.relativePath.replace(/___/g, '/')
    : remote.relativePath;

  // Double-check existing note: if soft-deleted, skip pulling/overwriting
  const existing = await db.files.get(reconstructedPath);
  if (existing?.isDeleted || existing?.isTrash) {
    return null;
  }

  const fileName = reconstructedPath.split('/').pop() || reconstructedPath;
  const title = fileName.replace(/\.[^/.]+$/, '');
  const extension = fileName.split('.').pop()?.toLowerCase() || 'md';

  const isBinary =
    imageExtensions.has(extension) ||
    pdfExtensions.has(extension) ||
    !['md', 'markdown', 'txt', 'json', 'yaml', 'yml'].includes(extension);

  const remoteModifiedMs = new Date(remote.modifiedTime).getTime();
  let textContent = '';
  let binaryBlob: Blob | undefined = undefined;
  let parsedFrontmatter: Record<string, any> = {};
  let tags: string[] = ['drive-synced'];
  let size = 0;

  if (isBinary) {
    const { arrayBuffer, mimeType } = await downloadRemoteBinary(token, remote.id);
    binaryBlob = new Blob([arrayBuffer], { type: mimeType });
    size = binaryBlob.size;
  } else {
    textContent = await downloadRemoteFile(token, remote.id);
    size = textContent.length;

    if (extension === 'md' || extension === 'markdown') {
      const parsed = parseFrontmatter(textContent);
      parsedFrontmatter = parsed.data || parsed;
      if (parsed.tags && Array.isArray(parsed.tags)) {
        tags = Array.from(new Set([...tags, ...parsed.tags]));
      }
    }
  }

  const record: VaultFile = {
    id: reconstructedPath,
    path: reconstructedPath,
    name: fileName,
    title: (parsedFrontmatter.title as string) || title,
    extension,
    content: textContent,
    frontmatter: parsedFrontmatter,
    tags,
    eisenhower: normalizeEisenhower(parsedFrontmatter.eisenhower),
    isBinary,
    blob: binaryBlob,
    mimeType: binaryBlob?.type,
    size,
    createdAt: remoteModifiedMs,
    updatedAt: remoteModifiedMs,
    vaultId: workspaceId,
    driveFileId: remote.id,
    driveId: remote.id,
    lastSyncedPath: reconstructedPath,
    previousPath: undefined,
    lastSyncedAt: Date.now(),
  };

  await db.files.put(record);
  return record;
}

/**
 * Push a single local note to Google Drive and update driveFileId and lastSyncedAt.
 */
export async function pushLocalNote(
  token: string,
  local: VaultFile,
  folderId: string,
  remoteFileId?: string
): Promise<string> {
  const driveFileName = local.path.replace(/\//g, '___');
  const fileBlob = getFileBlob(local);
  const metadata = {
    name: driveFileName,
    mimeType: local.mimeType || fileBlob.type,
  };
  const remoteId = await syncFileToDrive(
    token,
    metadata,
    fileBlob,
    remoteFileId ? undefined : folderId,
    remoteFileId
  );
  if (remoteId && local.id) {
    await db.files
      .update(local.id, {
        driveFileId: remoteId,
        driveId: remoteId,
        lastSyncedPath: local.path,
        previousPath: undefined,
        lastSyncedAt: Date.now(),
      })
      .catch(() => {});
  }
  return remoteId;
}


/**
 * runDriveSyncCycle
 * Executes the full bidirectional delta synchronization sequence between
 * local Dexie database notes (both active and trashed) and remote Google Drive files.
 */
export async function runDriveSyncCycle(
  workspaceId: string,
  params?: Partial<DriveSyncRunnerParams>
): Promise<DriveSyncStatus> {
  const token = params?.token || (await DriveAuthService.getValidToken());
  let folderId = params?.folderId;
  const workspaceName = params?.workspaceName || 'Vault';
  const { onProgress, onProgressState } = params || {};

  if (!folderId) {
    const { GoogleDriveSyncService } = await import('../googleDriveSync');
    folderId = await GoogleDriveSyncService.getOrCreateWorkspaceFolder(workspaceName);
  }

  const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

  onProgress?.('Scanning Google Drive for remote files...');
  const { files: remoteMap, trashedPaths, folders } = await crawlRemoteWorkspace(token, folderId);
  const remoteFiles = Array.from(remoteMap.values());

  const folderCache = new Map<string, string>();
  for (const [p, f] of folders.entries()) {
    folderCache.set(p, f.id);
  }

  const movedFolderPaths = await syncPendingFolderMoves(token, folderId, folders);

  onProgress?.('Analyzing local workspace notes...');
  const [activeNotes, trashedNotes] = await Promise.all([
    getAllNotes(workspaceId),
    getTrashedNotes(workspaceId),
  ]);
  const localNotes = [...activeNotes, ...trashedNotes];

  if (movedFolderPaths.size > 0) {
    for (const note of localNotes) {
      for (const movedFolder of movedFolderPaths) {
        if (note.lastSyncedPath?.startsWith(movedFolder + '/') || note.previousPath?.startsWith(movedFolder + '/')) {
          note.lastSyncedPath = note.path;
          note.previousPath = undefined;
          if (note.id) {
            await db.files
              .update(note.id, {
                lastSyncedPath: note.path,
                previousPath: undefined,
                lastSyncedAt: Date.now(),
              })
              .catch(() => {});
          }
        }
      }
    }
  }

  const actions = reconcileDriveState(localNotes, remoteFiles, trashedPaths, undefined, movedFolderPaths);
  const activeActions = actions.filter((a) => a.type !== 'noop');
  const totalFiles = activeActions.length;
  let processedFiles = 0;

  if (totalFiles > 0) {
    syncProgressEmitter.emit({
      status: 'syncing',
      totalFiles,
      processedFiles: 0,
      progressPercentage: 0,
    });
    onProgressState?.(syncProgressEmitter.getState());
  }

  for (const action of actions) {
    if (action.type === 'noop') {
      stats.skipped++;
      continue;
    }

    if (action.type === 'delete_local') {
      if (action.noteId) {
        onProgress?.(`Moving ${action.path} to trash (deleted remotely)...`);
        await softDeleteNote(action.noteId, workspaceId);
        try {
          useWorkspaceStore.getState().closeTab(action.noteId);
        } catch {
          // Ignore if called outside React context
        }
      }
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'downloading',
        currentFileName: action.path,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
      continue;
    }

    if (action.type === 'delete_remote') {
      if (action.remoteFileId) {
        onProgress?.(`Trashing remote file ${action.path}...`);
        await trashRemoteFile(action.remoteFileId, token);
      }
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'uploading',
        currentFileName: action.path,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
      continue;
    }

    if (action.type === 'move_remote' && action.local) {
      onProgress?.(`Relocating ${action.oldPath || action.path} on Google Drive...`);
      await moveRemoteNote(token, action.local, folderId, action, folderCache);
      stats.uploaded++;
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'uploading',
        currentFileName: action.path,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
      continue;
    }

    if (action.type === 'pull' && action.remote) {
      onProgress?.(`Downloading ${action.path}...`);
      const pulled = await pullRemoteNote(token, action.remote, workspaceId);
      if (pulled) {
        stats.downloaded++;
      } else {
        stats.skipped++;
      }
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'downloading',
        currentFileName: action.path,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
      continue;
    }

    if (action.type === 'push' && action.local) {
      onProgress?.(`Uploading ${action.path}...`);
      await pushLocalNote(token, action.local, folderId, action.remoteFileId);
      stats.uploaded++;
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'uploading',
        currentFileName: action.path,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
      continue;
    }
  }

  syncProgressEmitter.emit({
    status: 'completed',
    totalFiles,
    processedFiles: totalFiles,
    progressPercentage: 100,
    currentFileName: undefined,
    currentAction: undefined,
  });
  onProgressState?.(syncProgressEmitter.getState());

  return {
    isConnected: true,
    isSyncing: false,
    folderId,
    folderName: `CaffeineMD-${workspaceName}`,
    lastSyncedAt: Date.now(),
    lastError: null,
    stats,
  };
}

/**
 * executeDriveSyncSession
 * Backwards compatibility wrapper delegating to runDriveSyncCycle.
 */
export async function executeDriveSyncSession(
  params: DriveSyncRunnerParams
): Promise<DriveSyncStatus> {
  return runDriveSyncCycle(params.currentWorkspaceId, params);
}

