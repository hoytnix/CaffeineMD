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
      name: 'CaffeineMD Vault',
      mode: 'indexeddb',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workspaces.put(defaultWs);
    return defaultWs;
  }

  /**
   * Create a new local workspace stored in browser IndexedDB
   */
  public static async createLocalWorkspace(name: string): Promise<WorkspaceRecord> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Workspace name cannot be empty');

    const cleanId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const workspaceId = `local-${Date.now()}-${cleanId}`;

    const workspace: WorkspaceRecord = {
      id: workspaceId,
      name: trimmed,
      mode: 'indexeddb',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workspaces.put(workspace);

    // Seed a welcome note in the new workspace
    const welcomeTitle = `Welcome to ${trimmed}`;
    const welcomePath = `${welcomeTitle}.md`;
    await db.files.put({
      id: welcomePath,
      path: welcomePath,
      name: welcomePath,
      title: welcomeTitle,
      extension: 'md',
      content: `---\ntitle: ${welcomeTitle}\ntags: [workspace, notes]\nstatus: Doing\npriority: Medium\n---\n\n# ${welcomeTitle} ☕\n\nWelcome to your new local workspace! This vault is saved locally in your browser's IndexedDB storage.\n\n- Create notes with the **+** button in the sidebar\n- Organize ideas with bidirectional links \`[[Note Title]]\`\n- View knowledge graphs and Notion-style databases above\n`,
      frontmatter: {
        title: welcomeTitle,
        tags: ['workspace', 'notes'],
        status: 'Doing',
        priority: 'Medium',
      },
      tags: ['workspace', 'notes'],
      isBinary: false,
      size: 350,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultId: workspaceId,
    });

    return workspace;
  }

  /**
   * Create a new Google Drive workspace and initialize cloud sync
   */
  public static async createGoogleDriveWorkspace(name: string): Promise<WorkspaceRecord> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Workspace name cannot be empty');

    const cleanId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const workspaceId = `drive-${Date.now()}-${cleanId}`;

    // Dynamically import GoogleDriveSyncService to avoid circular dependency
    const { GoogleDriveSyncService } = await import('@/src/lib/sync/googleDriveSync');

    // Create or retrieve remote workspace folder in Google Drive
    const remote = await GoogleDriveSyncService.createRemoteWorkspace(trimmed);

    const workspace: WorkspaceRecord = {
      id: workspaceId,
      name: trimmed,
      mode: 'indexeddb',
      driveFolderId: remote.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workspaces.put(workspace);

    // Seed initial starter note in Google Drive workspace
    const welcomeTitle = `Welcome to ${trimmed}`;
    const welcomePath = `${welcomeTitle}.md`;
    await db.files.put({
      id: welcomePath,
      path: welcomePath,
      name: welcomePath,
      title: welcomeTitle,
      extension: 'md',
      content: `---\ntitle: ${welcomeTitle}\ntags: [cloud, drive-synced]\nstatus: Doing\npriority: High\n---\n\n# ${welcomeTitle} ☁️\n\nThis workspace is synced live with **Google Drive** folder \`${remote.folderName}\`.\n\n- All notes and assets sync bidirectionally\n- Access your notes anywhere across devices\n- Fully private and stored in your Google Drive\n`,
      frontmatter: {
        title: welcomeTitle,
        tags: ['cloud', 'drive-synced'],
        status: 'Doing',
        priority: 'High',
      },
      tags: ['cloud', 'drive-synced'],
      isBinary: false,
      size: 400,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultId: workspaceId,
    });

    // Run initial sync to upload starter note to Google Drive
    try {
      await GoogleDriveSyncService.syncNow(trimmed, remote.id, workspaceId);
    } catch (syncErr) {
      console.warn('Initial Google Drive sync note push warning:', syncErr);
    }

    return workspace;
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
