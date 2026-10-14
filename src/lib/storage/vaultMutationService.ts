import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import { triggerBackgroundAutoSync } from '@/src/lib/sync/syncAutoTrigger';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { db } from '@/src/lib/storage/db';

export interface MutationOptions {
  workspaceId?: string;
  skipDiskSync?: boolean;
  skipCloudSync?: boolean;
  syncDiskNote?: { path: string; content: string };
  removeDiskPath?: string;
  movedDiskPath?: { oldPath: string; newPath: string; content?: string };
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

  if (options.movedDiskPath && !options.skipDiskSync) {
    try {
      if (options.movedDiskPath.content !== undefined) {
        await NativeFileSystemAdapter.createNewFileOnDisk(
          options.movedDiskPath.newPath,
          options.movedDiskPath.content
        );
      }
      await NativeFileSystemAdapter.removeFileFromDisk(options.movedDiskPath.oldPath);
    } catch (diskErr) {
      console.warn('[vaultMutationService] Failed to mirror moved file on disk:', diskErr);
    }
  }

  // Refresh notes store cache for search index and reactive listeners
  try {
    const freshNotes = await db.files.toArray();
    useWorkspaceStore.getState().setNotes(freshNotes);
  } catch (err) {
    // Graceful fallback if in non-indexeddb or server environment
  }

  if (!options.skipCloudSync) {
    triggerBackgroundAutoSync();
  }

  return result;
}
