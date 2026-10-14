import { VaultFile } from '../storage/schema';
import { RemoteDriveFile } from './google/driveApiClient';

export interface UploadSyncTask {
  local: VaultFile;
  driveFileName: string;
  remoteId?: string;
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

  // 1. Check local files against remote files
  for (const [localPath, local] of localMap.entries()) {
    const driveFileName = localPath.replace(/\//g, '___');
    const remote = remoteMap.get(localPath) || remoteMap.get(driveFileName);

    if (!remote) {
      // Local exists, remote missing -> Upload new file
      uploadTasks.push({ local, driveFileName, remoteId: undefined });
    } else {
      const remoteTime = new Date(remote.modifiedTime).getTime();
      const localTime = local.updatedAt;

      if (localTime - remoteTime > toleranceMs) {
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
    const altFlatPath = remotePath.replace(/___/g, '/');
    const local = localMap.get(remotePath) || localMap.get(altFlatPath);

    if (!local) {
      // Remote exists, local missing -> Enqueue for download
      downloadTasks.push(remote);
    }
  }

  return {
    uploadTasks,
    downloadTasks,
    skippedCount,
  };
}
