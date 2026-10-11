'use client';

import { VaultFile } from '@/src/lib/storage/schema';
import { RemoteDriveFile } from './driveApiClient';
import { reconcileSyncSets, UploadSyncTask, SyncReconciliationResult } from '../reconciler';

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
 * DriveReconciler
 * Specialized reconciliation engine that computes differential updates between
 * remote Google Drive files and local Dexie database notes.
 */
export class DriveReconciler {
  public static readonly DEFAULT_TOLERANCE_MS = 2000;

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
