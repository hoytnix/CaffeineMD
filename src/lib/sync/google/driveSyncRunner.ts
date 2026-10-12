'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import { DriveSyncStatus } from './driveApiClient';
import { listAllRemoteFiles } from './remoteCrawler';
import { DriveReconciler } from './driveReconciler';
import { executeDownloadBatch, executeUploadBatch } from '../syncExecutor';
import { SyncProgressState, syncProgressEmitter } from '../syncProgress';

export interface DriveSyncRunnerParams {
  token: string;
  folderId: string;
  workspaceName: string;
  currentWorkspaceId: string;
  onProgress?: (statusText: string) => void;
  onProgressState?: (state: SyncProgressState) => void;
}

/**
 * executeDriveSyncSession
 * Executes the full bidirectional delta synchronization sequence between
 * local Dexie database notes and remote Google Drive files.
 */
export async function executeDriveSyncSession({
  token,
  folderId,
  workspaceName,
  currentWorkspaceId,
  onProgress,
  onProgressState,
}: DriveSyncRunnerParams): Promise<DriveSyncStatus> {
  const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

  onProgress?.('Scanning Google Drive for remote files...');
  const remoteMap = await listAllRemoteFiles(token, folderId);

  onProgress?.('Analyzing local workspace notes...');
  const allLocal = await db.files.toArray();
  const localFiles =
    currentWorkspaceId === 'default-vault'
      ? allLocal.filter((f) => !f.vaultId || f.vaultId === 'default-vault')
      : allLocal.filter((f) => f.vaultId === currentWorkspaceId);

  const localMap = new Map<string, VaultFile>();
  for (const local of localFiles) {
    if (local.isTrash) continue;
    const normalizedLocalPath = local.path.replace(/\\/g, '/').replace(/^\/+/, '');
    localMap.set(normalizedLocalPath, local);
  }

  const plan = DriveReconciler.reconcile(localMap, remoteMap, 2000);
  const { uploadTasks, downloadTasks, skippedCount } = plan;
  stats.skipped += skippedCount;

  const totalFiles = downloadTasks.length + uploadTasks.length;
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

  // Execute downloads
  stats.downloaded += await executeDownloadBatch(
    token,
    downloadTasks,
    currentWorkspaceId,
    onProgress,
    (fileName) => {
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'downloading',
        currentFileName: fileName,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
    }
  );

  // Execute uploads
  stats.uploaded += await executeUploadBatch(
    token,
    uploadTasks,
    folderId,
    onProgress,
    (fileName) => {
      processedFiles++;
      syncProgressEmitter.emit({
        status: 'syncing',
        currentAction: 'uploading',
        currentFileName: fileName,
        totalFiles,
        processedFiles,
      });
      onProgressState?.(syncProgressEmitter.getState());
    }
  );

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
