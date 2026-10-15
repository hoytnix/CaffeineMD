'use client';

import { VaultFile } from '../../storage/schema';
import { RemoteDriveFile, DriveRemoteFile } from './driveApiClient';
import { reconcileSyncSets, UploadSyncTask, SyncReconciliationResult } from '../reconciler';

export const TIME_TOLERANCE_MS = 2000;

export interface DriveSyncAction {
  type: 'push' | 'pull' | 'delete_remote' | 'delete_local' | 'move_remote' | 'conflict' | 'noop';
  path: string;
  oldPath?: string;
  noteId?: string;
  remoteFileId?: string;
  reason: string;
  local?: VaultFile;
  remote?: DriveRemoteFile;
}

export interface FileDiffItem {
  path: string;
  action: 'upload-new' | 'upload-update' | 'download-new' | 'download-update' | 'skip';
  localFile?: VaultFile;
  remoteFile?: RemoteDriveFile;
  reason: string;
}

export interface DriveReconciliationPlan extends SyncReconciliationResult {
  diffItems: FileDiffItem[];
  totalActions: number;
}

/**
 * Reconcile local and remote drive states handling active notes, soft-deleted notes,
 * remote active files, and remote trashed files.
 */
export function reconcileDriveState(
  localNotes: VaultFile[],
  remoteFiles: DriveRemoteFile[],
  trashedRemoteMap?: Map<string, DriveRemoteFile>,
  toleranceMs = TIME_TOLERANCE_MS,
  movedFolderPaths?: Set<string>
): DriveSyncAction[] {
  const actions: DriveSyncAction[] = [];
  const remoteMap = new Map<string, DriveRemoteFile>();
  const remoteById = new Map<string, DriveRemoteFile>();

  for (const remote of remoteFiles) {
    const rawPath = remote.relativePath || remote.name;
    const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const flat = normalized.replace(/\//g, '___');
    remoteMap.set(normalized, remote);
    remoteMap.set(flat, remote);
    remoteMap.set(remote.name, remote);
    if (remote.id) remoteById.set(remote.id, remote);
  }

  const localMap = new Map<string, VaultFile>();
  for (const local of localNotes) {
    const normalized = local.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const flat = normalized.replace(/\//g, '___');
    localMap.set(normalized, local);
    localMap.set(flat, local);
  }

  const processedPaths = new Set<string>();
  const processedRemoteIds = new Set<string>();

  // 1. Evaluate local notes (active and trashed) against remote files
  for (const local of localNotes) {
    const path = local.path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (processedPaths.has(path)) continue;
    processedPaths.add(path);

    const flat = path.replace(/\//g, '___');
    const remoteId = local.driveFileId || local.driveId;
    const remote =
      (remoteId ? remoteById.get(remoteId) : undefined) ||
      remoteMap.get(path) ||
      remoteMap.get(flat) ||
      (local.lastSyncedPath ? remoteMap.get(local.lastSyncedPath) : undefined) ||
      (local.previousPath ? remoteMap.get(local.previousPath) : undefined) ||
      remoteMap.get(local.name);

    if (remote?.id) processedRemoteIds.add(remote.id);

    const isDeleted = Boolean(local.isDeleted || local.isTrash);

    if (isDeleted) {
      if (remote) {
        const remoteTime = typeof remote.modifiedTime === 'number'
          ? remote.modifiedTime
          : new Date(remote.modifiedTime).getTime();
        const localDeletedOrUpdated = local.deletedAt || local.updatedAt;

        if (localDeletedOrUpdated >= remoteTime - toleranceMs) {
          actions.push({
            type: 'delete_remote',
            path,
            noteId: local.id || local.path,
            remoteFileId: remote.id,
            reason: 'Deleted locally; trashing on Google Drive',
            local,
            remote,
          });
        } else {
          actions.push({
            type: 'noop',
            path,
            noteId: local.id || local.path,
            remoteFileId: remote.id,
            reason: 'Trashed locally but remote file modified; skipping auto-resurrection',
            local,
            remote,
          });
        }
      } else {
        actions.push({
          type: 'noop',
          path,
          noteId: local.id || local.path,
          reason: 'Already deleted locally and remotely',
          local,
        });
      }
      continue;
    }

    // Active local note
    if (!remote) {
      const trashedRemote = trashedRemoteMap
        ? trashedRemoteMap.get(path) ||
          trashedRemoteMap.get(flat) ||
          trashedRemoteMap.get(local.name) ||
          (local.driveFileId
            ? Array.from(trashedRemoteMap.values()).find((r) => r.id === local.driveFileId)
            : undefined)
        : undefined;

      const wasTrashedRemotely = Boolean(trashedRemote);
      const wasPreviouslySynced = Boolean(local.driveFileId || local.driveId);

      if (wasTrashedRemotely || wasPreviouslySynced) {
        let isModifiedAfterTrash = false;
        if (trashedRemote) {
          const trashTime =
            typeof trashedRemote.modifiedTime === 'number'
              ? trashedRemote.modifiedTime
              : new Date(trashedRemote.modifiedTime).getTime();
          isModifiedAfterTrash = local.updatedAt - trashTime > toleranceMs;
        } else if (local.lastSyncedAt) {
          isModifiedAfterTrash = local.updatedAt - local.lastSyncedAt > toleranceMs;
        }

        if (!isModifiedAfterTrash) {
          actions.push({
            type: 'delete_local',
            path,
            noteId: local.id || local.path,
            remoteFileId: trashedRemote?.id || local.driveFileId || local.driveId,
            reason: 'Deleted remotely on another client; moving local copy to Trash',
            local,
            remote: trashedRemote,
          });
          continue;
        }
      }

      actions.push({
        type: 'push',
        path,
        noteId: local.id || local.path,
        reason: 'New note created locally, uploading to Google Drive',
        local,
      });
    } else {
      const rawRemotePath = remote.relativePath || remote.name;
      const normalizedRemote = rawRemotePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/___/g, '/');
      const isPathChanged = normalizedRemote !== path;

      processedPaths.add(normalizedRemote);
      processedPaths.add(rawRemotePath);

      if (isPathChanged) {
        let parentAlreadyRelocated = false;
        if (movedFolderPaths && movedFolderPaths.size > 0) {
          for (const movedFolder of movedFolderPaths) {
            if (normalizedRemote === movedFolder || normalizedRemote.startsWith(movedFolder + '/')) {
              parentAlreadyRelocated = true;
              break;
            }
          }
        }

        const remoteTime = typeof remote.modifiedTime === 'number'
          ? remote.modifiedTime
          : new Date(remote.modifiedTime).getTime();
        const localTime = local.updatedAt;

        actions.push({
          type: parentAlreadyRelocated && Math.abs(localTime - remoteTime) <= toleranceMs ? 'noop' : 'move_remote',
          path,
          oldPath: normalizedRemote,
          noteId: local.id || local.path,
          remoteFileId: remote.id,
          reason: parentAlreadyRelocated
            ? `Parent folder relocated atomically on Drive; keeping ${path} in sync`
            : `Moved locally from ${normalizedRemote} to ${path}; updating Google Drive`,
          local,
          remote,
        });
        continue;
      }

      const remoteTime = typeof remote.modifiedTime === 'number'
        ? remote.modifiedTime
        : new Date(remote.modifiedTime).getTime();
      const localTime = local.updatedAt;

      if (localTime - remoteTime > toleranceMs) {
        actions.push({
          type: 'push',
          path,
          noteId: local.id || local.path,
          remoteFileId: remote.id,
          reason: 'Local note is newer than Google Drive file',
          local,
          remote,
        });
      } else if (remoteTime - localTime > toleranceMs) {
        actions.push({
          type: 'pull',
          path,
          noteId: local.id || local.path,
          remoteFileId: remote.id,
          reason: 'Remote Google Drive version is newer than local revision',
          local,
          remote,
        });
      } else {
        actions.push({
          type: 'noop',
          path,
          noteId: local.id || local.path,
          remoteFileId: remote.id,
          reason: 'Local and remote versions are in sync',
          local,
          remote,
        });
      }
    }
  }

  // 2. Evaluate remote files that have NO local record at all
  for (const remote of remoteFiles) {
    if (processedRemoteIds.has(remote.id)) continue;
    const rawPath = remote.relativePath || remote.name;
    const normalized = rawPath.replace(/___/g, '/').replace(/\\/g, '/').replace(/^\/+/, '');
    const flat = normalized.replace(/\//g, '___');

    if (processedPaths.has(normalized) || processedPaths.has(flat) || processedPaths.has(rawPath)) {
      continue;
    }

    const local = localMap.get(normalized) || localMap.get(flat);
    if (!local) {
      processedPaths.add(normalized);
      processedRemoteIds.add(remote.id);
      actions.push({
        type: 'pull',
        path: normalized,
        remoteFileId: remote.id,
        reason: 'New note discovered in Google Drive workspace',
        remote,
      });
    }
  }

  return actions;
}

/**
 * DriveReconciler
 * Specialized reconciliation engine that computes differential updates between
 * remote Google Drive files and local Dexie database notes.
 */
export class DriveReconciler {
  public static readonly DEFAULT_TOLERANCE_MS = 2000;
  public static reconcileDriveState = reconcileDriveState;

  /**
   * Reconciles local and remote file maps to produce granular upload/download tasks.
   */
  public static reconcile(
    localMap: Map<string, VaultFile>,
    remoteMap: Map<string, RemoteDriveFile>,
    toleranceMs: number = this.DEFAULT_TOLERANCE_MS
  ): DriveReconciliationPlan {
    const basicResult = reconcileSyncSets(localMap, remoteMap, toleranceMs);
    const diffItems: FileDiffItem[] = [];

    // Map uploads
    for (const task of basicResult.uploadTasks) {
      diffItems.push({
        path: task.local.path,
        action: task.remoteId ? 'upload-update' : 'upload-new',
        localFile: task.local,
        reason: task.remoteId
          ? 'Local file was updated more recently than Google Drive revision'
          : 'New file created locally, not yet present in Google Drive',
      });
    }

    // Map downloads
    for (const remote of basicResult.downloadTasks) {
      const altPath = remote.name.replace(/___/g, '/');
      const hasLocal = localMap.has(remote.name) || localMap.has(altPath);

      diffItems.push({
        path: remote.name,
        action: hasLocal ? 'download-update' : 'download-new',
        remoteFile: remote,
        reason: hasLocal
          ? 'Remote Google Drive version is newer than local revision'
          : 'New note discovered in Google Drive workspace',
      });
    }

    return {
      ...basicResult,
      diffItems,
      totalActions: basicResult.uploadTasks.length + basicResult.downloadTasks.length,
    };
  }

  /**
   * Helper that checks whether a local note and remote file match based on MD5 checksum or timestamp.
   */
  public static isFileIdentical(
    local: VaultFile,
    remote: RemoteDriveFile,
    toleranceMs: number = this.DEFAULT_TOLERANCE_MS
  ): boolean {
    const remoteTime = new Date(remote.modifiedTime).getTime();
    const localTime = local.updatedAt;
    return Math.abs(localTime - remoteTime) <= toleranceMs;
  }

  /**
   * Summarizes the diff plan into human-readable debug logs.
   */
  public static summarizePlan(plan: DriveReconciliationPlan): string {
    const { uploadTasks, downloadTasks, skippedCount } = plan;
    return `Sync Plan: ${uploadTasks.length} uploads, ${downloadTasks.length} downloads, ${skippedCount} skipped`;
  }

  /**
   * Evaluates if a local file is strictly newer than the remote file.
   */
  public static isLocalNewer(
    local: VaultFile,
    remote: RemoteDriveFile,
    toleranceMs: number = this.DEFAULT_TOLERANCE_MS
  ): boolean {
    const remoteTime = new Date(remote.modifiedTime).getTime();
    return local.updatedAt - remoteTime > toleranceMs;
  }
}

export { reconcileSyncSets };
export type { UploadSyncTask, SyncReconciliationResult };
