'use client';

import { DriveAuthService } from './google/driveAuthService';
import { DrivePayloadBuilder } from './google/drivePayloadBuilder';
import { executeDriveSyncSession } from './google/driveSyncRunner';
import { syncProgressEmitter, SyncProgressState } from './syncProgress';

// Re-export submodules to preserve full backwards compatibility
export * from './google/driveApiClient';
export * from './google/resumableChunkUploader';
export * from './google/remoteCrawler';
export * from './google/driveAuthService';
export * from './google/drivePayloadBuilder';
export * from './google/driveReconciler';
export * from './google/driveSyncRunner';
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
    const safeName = `CaffeineMD-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.folderCache.set(safeName, folderId);
    this.folderCache.set(workspaceName, folderId);
    this.cachedFolderId = folderId;
  }

  public static async listRemoteWorkspaces(): Promise<RemoteWorkspace[]> {
    const token = await DriveAuthService.getValidToken().catch(() => null);
    if (!token) return [];

    try {
      const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and (name contains 'CaffeineMD' or name contains 'Kite')`;
      const data = await fetchDriveFiles(token, query, 'files(id,name,modifiedTime)');
      const files: Array<{ id: string; name: string; modifiedTime?: string }> = data.files || [];

      return files.map((f) => {
        let cleanName = f.name;
        if (cleanName.startsWith('CaffeineMD-')) {
          cleanName = cleanName.replace(/^CaffeineMD-/, '').replace(/_/g, ' ');
        } else if (cleanName.startsWith('Kite-')) {
          cleanName = cleanName.replace(/^Kite-/, '').replace(/_/g, ' ');
        }
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
    const safeName = `CaffeineMD-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.setWorkspaceFolder(workspaceName, folderId);
    return { id: folderId, name: workspaceName, folderName: safeName };
  }

  public static async getOrCreateWorkspaceFolder(workspaceName: string): Promise<string> {
    const safeName = `CaffeineMD-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    if (this.folderCache.has(safeName)) {
      return this.folderCache.get(safeName)!;
    }

    const token = await DriveAuthService.getValidToken();
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
    try {
      syncProgressEmitter.emit({
        status: 'scanning',
        totalFiles: 0,
        processedFiles: 0,
        progressPercentage: 0,
        errorMessage: undefined,
      });
      onProgressState?.(syncProgressEmitter.getState());

      const token = await DriveAuthService.getValidToken();

      onProgress?.('Resolving workspace folder...');
      const folderId = targetFolderId || (await this.getOrCreateWorkspaceFolder(workspaceName));
      this.setWorkspaceFolder(workspaceName, folderId);

      const currentWorkspaceId =
        targetWorkspaceId ||
        (workspaceName === 'Local Vault'
          ? 'default-vault'
          : `drive-${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);

      const result = await executeDriveSyncSession({
        token,
        folderId,
        workspaceName,
        currentWorkspaceId,
        onProgress,
        onProgressState,
      });

      this.lastSyncTime = result.lastSyncedAt;
      onProgress?.('Synced');
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Sync failed';
      console.error('Google Drive Sync error:', err);
      syncProgressEmitter.emit({
        status: 'error',
        errorMessage: errMsg,
      });
      onProgressState?.(syncProgressEmitter.getState());

      return {
        isConnected: false,
        isSyncing: false,
        folderId: this.cachedFolderId,
        folderName: `CaffeineMD-${workspaceName}`,
        lastSyncedAt: this.lastSyncTime,
        lastError: errMsg,
        stats: { uploaded: 0, downloaded: 0, skipped: 0 },
      };
    }
  }

  public static async uploadFile(
    folderId: string,
    name: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await DriveAuthService.getValidToken();
    const fileBlob = DrivePayloadBuilder.packageNoteContent(contentOrBlob, mimeType);
    return syncFileToDrive(token, { name, mimeType: mimeType || fileBlob.type || 'text/markdown' }, fileBlob, folderId);
  }

  public static async updateFile(
    fileId: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await DriveAuthService.getValidToken();
    const fileBlob = DrivePayloadBuilder.packageNoteContent(contentOrBlob, mimeType);
    return syncFileToDrive(token, { mimeType: mimeType || fileBlob.type || 'text/markdown' }, fileBlob, undefined, fileId);
  }

  public static getCachedStatus(): Partial<DriveSyncStatus> {
    return { folderId: this.cachedFolderId, lastSyncedAt: this.lastSyncTime };
  }
}

export const syncWorkspaceWithDrive = (workspaceId: string) =>
  GoogleDriveSyncService.syncNow(workspaceId);
