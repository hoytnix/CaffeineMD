'use client';

import { db, WorkspaceRecord } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import { runIngestionPipeline, ImportProgress } from '@/src/lib/storage/importPipeline';

export class WorkspaceManager {
  /**
   * Initialize default workspace in db if not present
   */
  public static async ensureDefaultWorkspace(): Promise<WorkspaceRecord> {
    const existing = await db.workspaces.get('default-vault');
    if (existing) return existing;

    const defaultWs: WorkspaceRecord = {
      id: 'default-vault',
      name: 'Local Vault',
      mode: 'indexeddb',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workspaces.put(defaultWs);
    return defaultWs;
  }

  /**
   * Mount a new local disk directory as a dedicated workspace
   */
  public static async mountDiskFolderAsWorkspace(
    onProgress?: (progress: ImportProgress) => void
  ): Promise<WorkspaceRecord> {
    const { handle, name } = await NativeFileSystemAdapter.pickDirectory();
    const workspaceId = `disk-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Scan the folder files
    const scannedFiles = await NativeFileSystemAdapter.scanDirectory(
      handle,
      '',
      (scannedCount, currentItem) => {
        if (onProgress) {
          onProgress({
            scanned: scannedCount,
            parsed: 0,
            indexed: 0,
            skipped: 0,
            currentFileName: currentItem,
            isComplete: false,
            errors: [],
          });
        }
      }
    );

    // Save workspace record
    const workspace: WorkspaceRecord = {
      id: workspaceId,
      name,
      mode: 'filesystem',
      handle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workspaces.put(workspace);

    // Convert scanned files to ImportFile objects and ingest
    if (scannedFiles.length > 0) {
      const importFiles = scannedFiles.map((sf) => ({
        file: sf.file,
        relativePath: sf.path,
        name: sf.name,
      }));

      await runIngestionPipeline(importFiles, workspaceId, (p) => {
        if (onProgress) onProgress(p);
      });
    }

    return workspace;
  }

  /**
   * Switch to a different workspace
   */
  public static async switchWorkspace(workspaceId: string): Promise<WorkspaceRecord | null> {
    const ws = await db.workspaces.get(workspaceId);
    if (!ws) return null;

    if (ws.mode === 'filesystem' && ws.handle) {
      // Set root handle in adapter
      // @ts-ignore
      NativeFileSystemAdapter.rootHandle = ws.handle;
    }

    return ws;
  }

  /**
   * Disconnect and remove a workspace
   */
  public static async disconnectWorkspace(workspaceId: string): Promise<void> {
    if (workspaceId === 'default-vault') {
      // Just clear files if default
      await db.files.where('vaultId').equals('default-vault').delete();
      return;
    }

    await db.workspaces.delete(workspaceId);
    // Remove files belonging to this workspace
    await db.files.where('vaultId').equals(workspaceId).delete();
    await db.backlinks.where('vaultId').equals(workspaceId).delete();
  }

  /**
   * List all registered workspaces
   */
  public static async listWorkspaces(): Promise<WorkspaceRecord[]> {
    await this.ensureDefaultWorkspace();
    return db.workspaces.toArray();
  }
}
