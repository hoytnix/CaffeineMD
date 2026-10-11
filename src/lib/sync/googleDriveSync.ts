'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import { getAccessToken } from '@/src/lib/firebase/client';

// Re-export submodules to preserve full backwards compatibility
export * from './google/driveApiClient';
export * from './google/resumableChunkUploader';
export * from './google/remoteCrawler';
export * from './reconciler';
export * from './syncExecutor';
export * from './syncProgress';

import {
  RemoteWorkspace,
  DriveSyncStatus,
  driveFetch,
  fetchDriveFiles,
  downloadRemoteFile,
  downloadRemoteBinary,
  uploadSmallFile,
} from './google/driveApiClient';

import {
  CHUNK_SIZE,
  SMALL_FILE_THRESHOLD,
  uploadLargeFileResumable,
  syncFileToDrive,
} from './google/resumableChunkUploader';

import { listAllRemoteFiles } from './google/remoteCrawler';
import { reconcileSyncSets } from './reconciler';
import { executeDownloadBatch, executeUploadBatch } from './syncExecutor';
import { SyncProgressState, syncProgressEmitter } from './syncProgress';

export class GoogleDriveSyncService {
  public static readonly CHUNK_SIZE = CHUNK_SIZE;
  public static readonly SMALL_FILE_THRESHOLD = SMALL_FILE_THRESHOLD;

  public static uploadSmallFile = uploadSmallFile;
  public static uploadLargeFileResumable = uploadLargeFileResumable;
  public static syncFileToDrive = syncFileToDrive;
  public static listAllRemoteFiles = listAllRemoteFiles;
  public static downloadRemoteFile = downloadRemoteFile;
  public static downloadRemoteBinary = downloadRemoteBinary;

  private static folderCache: Map<string, string> = new Map();
  private static lastSyncTime: number | null = null;
  private static cachedFolderId: string | null = null;

  public static setWorkspaceFolder(workspaceName: string, folderId: string) {
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.folderCache.set(safeName, folderId);
    this.folderCache.set(workspaceName, folderId);
    this.cachedFolderId = folderId;
  }

  public static async listRemoteWorkspaces(): Promise<RemoteWorkspace[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
      const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains 'Kite'`;
      const data = await fetchDriveFiles(token, query, 'files(id,name,modifiedTime)');
      const files: Array<{ id: string; name: string; modifiedTime?: string }> = data.files || [];

      return files.map((f) => {
        const cleanName = f.name.startsWith('Kite-')
          ? f.name.replace(/^Kite-/, '').replace(/_/g, ' ')
          : f.name;
        return {
          id: f.id,
          folderName: f.name,
          name: cleanName || f.name,
          modifiedTime: f.modifiedTime,
        };
      });
    } catch (err) {
      console.error('Failed to list remote workspaces from Drive:', err);
      return [];
    }
  }

  public static async createRemoteWorkspace(workspaceName: string): Promise<RemoteWorkspace> {
    const folderId = await this.getOrCreateWorkspaceFolder(workspaceName);
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.setWorkspaceFolder(workspaceName, folderId);
    return { id: folderId, name: workspaceName, folderName: safeName };
  }

  public static async getOrCreateWorkspaceFolder(workspaceName: string): Promise<string> {
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    if (this.folderCache.has(safeName)) {
      return this.folderCache.get(safeName)!;
    }

    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    }

    const query = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const data = await fetchDriveFiles(token, query, 'files(id,name)');

    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      this.folderCache.set(safeName, folderId);
      this.cachedFolderId = folderId;
      return folderId;
    }

    const createRes = await driveFetch(token, 'files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: safeName, mimeType: 'application/vnd.google-apps.folder' }),
    });

    const created = await createRes.json();
    const newFolderId = created.id;
    this.folderCache.set(safeName, newFolderId);
    this.cachedFolderId = newFolderId;
    return newFolderId;
  }

  public static async syncNow(
    workspaceName: string,
    targetFolderId?: string,
    targetWorkspaceId?: string,
    onProgress?: (statusText: string) => void,
    onProgressState?: (state: SyncProgressState) => void
  ): Promise<DriveSyncStatus> {
    const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

    try {
      syncProgressEmitter.emit({
        status: 'scanning',
        totalFiles: 0,
        processedFiles: 0,
        progressPercentage: 0,
        errorMessage: undefined,
      });
      onProgressState?.(syncProgressEmitter.getState());

      const token = await getAccessToken();
      if (!token) {
        throw new Error('Google Drive access token is not available. Please sign in with Google first.');
      }

      onProgress?.('Resolving workspace folder...');
      const folderId = targetFolderId || (await this.getOrCreateWorkspaceFolder(workspaceName));
      this.setWorkspaceFolder(workspaceName, folderId);

      const currentWorkspaceId =
        targetWorkspaceId ||
        (workspaceName === 'Local Vault'
          ? 'default-vault'
          : `drive-${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);

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

      const { uploadTasks, downloadTasks, skippedCount } = reconcileSyncSets(localMap, remoteMap, 2000);
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

      this.lastSyncTime = Date.now();
      onProgress?.('Synced');

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
        folderName: `Kite-${workspaceName}`,
        lastSyncedAt: this.lastSyncTime,
        lastError: null,
        stats,
      };
    } catch (err: any) {
      console.error('Google Drive Sync error:', err);
      syncProgressEmitter.emit({
        status: 'error',
        errorMessage: err?.message || 'Sync failed',
      });
      onProgressState?.(syncProgressEmitter.getState());

      return {
        isConnected: false,
        isSyncing: false,
        folderId: this.cachedFolderId,
        folderName: `Kite-${workspaceName}`,
        lastSyncedAt: this.lastSyncTime,
        lastError: err?.message || 'Sync failed',
        stats,
      };
    }
  }

  public static async uploadFile(
    folderId: string,
    name: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await getAccessToken();
    if (!token) throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    const fileBlob = typeof contentOrBlob === 'string'
      ? new Blob([contentOrBlob], { type: mimeType || 'text/markdown; charset=UTF-8' })
      : contentOrBlob;
    return syncFileToDrive(token, { name, mimeType: mimeType || fileBlob.type || 'text/markdown' }, fileBlob, folderId);
  }

  public static async updateFile(
    fileId: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await getAccessToken();
    if (!token) throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    const fileBlob = typeof contentOrBlob === 'string'
      ? new Blob([contentOrBlob], { type: mimeType || 'text/markdown; charset=UTF-8' })
      : contentOrBlob;
    return syncFileToDrive(token, { mimeType: mimeType || fileBlob.type || 'text/markdown' }, fileBlob, undefined, fileId);
  }

  public static getCachedStatus(): Partial<DriveSyncStatus> {
    return { folderId: this.cachedFolderId, lastSyncedAt: this.lastSyncTime };
  }
}

export const syncWorkspaceWithDrive = (workspaceId: string) =>
  GoogleDriveSyncService.syncNow(workspaceId);
