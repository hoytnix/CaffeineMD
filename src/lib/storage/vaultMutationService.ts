import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import { triggerBackgroundAutoSync } from '@/src/lib/sync/syncAutoTrigger';

export interface MutationOptions {
  workspaceId?: string;
  skipDiskSync?: boolean;
  skipCloudSync?: boolean;
  syncDiskNote?: { path: string; content: string };
  removeDiskPath?: string;
}

export async function executeVaultMutation<T>(
  operation: () => Promise<T>,
  options: MutationOptions = {}
): Promise<T> {
  const result = await operation();

  if (options.syncDiskNote && !options.skipDiskSync) {
    try {
      await NativeFileSystemAdapter.writeBackToFile(
        options.syncDiskNote.path,
        options.syncDiskNote.content
      );
    } catch (diskErr) {
      console.warn('[vaultMutationService] Failed to sync note to disk:', diskErr);
    }
  }

  if (options.removeDiskPath && !options.skipDiskSync) {
    try {
      await NativeFileSystemAdapter.removeFileFromDisk(options.removeDiskPath);
    } catch (diskErr) {
      console.warn('[vaultMutationService] Failed to remove file from disk:', diskErr);
    }
  }

  if (!options.skipCloudSync) {
    triggerBackgroundAutoSync();
  }

  return result;
}
