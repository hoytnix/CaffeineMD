import { VaultFile } from '../storage/schema';
import { RemoteDriveFile } from './google/driveApiClient';

export interface UploadSyncTask {
  local: VaultFile;
  driveFileName: string;
  remoteId?: string;
  isMove?: boolean;
  oldPath?: string;
}

export interface SyncReconciliationResult {
  uploadTasks: UploadSyncTask[];
  downloadTasks: RemoteDriveFile[];
  skippedCount: number;
}

/**
 * Pure differential sync reconciler comparing local vs remote state
 * with a tolerance threshold to handle minor filesystem/cloud timestamp jitter.
 */
export function reconcileSyncSets(
  localMap: Map<string, VaultFile>,
  remoteMap: Map<string, RemoteDriveFile>,
  toleranceMs = 2000
): SyncReconciliationResult {
  const uploadTasks: UploadSyncTask[] = [];
  const downloadTasks: RemoteDriveFile[] = [];
  let skippedCount = 0;

  const remoteById = new Map<string, RemoteDriveFile>();
  for (const remote of remoteMap.values()) {
    if (remote.id) remoteById.set(remote.id, remote);
  }

  const processedPaths = new Set<string>();
  const processedRemoteIds = new Set<string>();

  // 1. Check local files against remote files
  for (const [localPath, local] of localMap.entries()) {
    const driveFileName = localPath.replace(/\//g, '___');
    const remoteId = local.driveFileId || local.driveId;
    const remote =
      (remoteId ? remoteById.get(remoteId) : undefined) ||
      remoteMap.get(localPath) ||
      remoteMap.get(driveFileName) ||
      (local.lastSyncedPath ? remoteMap.get(local.lastSyncedPath) : undefined) ||
      (local.previousPath ? remoteMap.get(local.previousPath) : undefined);

    processedPaths.add(localPath);
    processedPaths.add(driveFileName);

    if (!remote) {
      // Local exists, remote missing -> Upload new file
      uploadTasks.push({ local, driveFileName, remoteId: undefined });
    } else {
      if (remote.id) processedRemoteIds.add(remote.id);
      const rawRemotePath = remote.relativePath || remote.name;
      const normalizedRemote = rawRemotePath.replace(/___/g, '/').replace(/\\/g, '/').replace(/^\/+/, '');
      processedPaths.add(normalizedRemote);
      processedPaths.add(rawRemotePath);

      const isPathChanged = normalizedRemote !== localPath;
      const remoteTime = new Date(remote.modifiedTime).getTime();
      const localTime = local.updatedAt;

      if (isPathChanged) {
        uploadTasks.push({ local, driveFileName, remoteId: remote.id, isMove: true, oldPath: normalizedRemote });
      } else if (localTime - remoteTime > toleranceMs) {
        // Local is newer -> Upload update
        uploadTasks.push({ local, driveFileName, remoteId: remote.id });
      } else if (remoteTime - localTime > toleranceMs) {
        // Remote is newer -> Download update
        downloadTasks.push(remote);
      } else {
        // Timestamps match within tolerance threshold -> Skip
        skippedCount++;
      }
    }
  }

  // 2. Check remote files that do not exist locally
  for (const [remotePath, remote] of remoteMap.entries()) {
    if (processedRemoteIds.has(remote.id)) continue;
    const altFlatPath = remotePath.replace(/___/g, '/').replace(/\\/g, '/').replace(/^\/+/, '');
    if (processedPaths.has(remotePath) || processedPaths.has(altFlatPath)) continue;

    const local = localMap.get(remotePath) || localMap.get(altFlatPath);
    if (!local) {
      processedPaths.add(remotePath);
      processedRemoteIds.add(remote.id);
      downloadTasks.push(remote);
    }
  }

  return {
    uploadTasks,
    downloadTasks,
    skippedCount,
  };
}
