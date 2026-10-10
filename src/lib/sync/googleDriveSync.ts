'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import { getAccessToken } from '@/src/lib/firebase/client';

export interface DriveSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  folderId: string | null;
  folderName: string | null;
  lastSyncedAt: number | null;
  lastError: string | null;
  stats: {
    uploaded: number;
    downloaded: number;
    skipped: number;
  };
}

export class GoogleDriveSyncService {
  private static folderCache: Map<string, string> = new Map(); // workspaceName -> folderId
  private static lastSyncTime: number | null = null;
  private static cachedFolderId: string | null = null;

  /**
   * Helper to make authenticated Google Drive API requests
   */
  private static async driveFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive API error (${res.status}): ${errText}`);
    }

    return res;
  }

  /**
   * Find or create the dedicated root folder for the Kite workspace in Google Drive
   */
  public static async getOrCreateWorkspaceFolder(workspaceName: string): Promise<string> {
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (this.folderCache.has(safeName)) {
      return this.folderCache.get(safeName)!;
    }

    // Search for existing folder
    const query = encodeURIComponent(
      `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await this.driveFetch(`files?q=${query}&fields=files(id,name)`);
    const data = await searchRes.json();

    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      this.folderCache.set(safeName, folderId);
      this.cachedFolderId = folderId;
      return folderId;
    }

    // Create folder
    const createRes = await this.driveFetch('files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const created = await createRes.json();
    const newFolderId = created.id;
    this.folderCache.set(safeName, newFolderId);
    this.cachedFolderId = newFolderId;
    return newFolderId;
  }

  /**
   * Perform bidirectional synchronization between local Dexie notes and Google Drive
   */
  public static async syncNow(workspaceName: string): Promise<DriveSyncStatus> {
    const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

    try {
      const folderId = await this.getOrCreateWorkspaceFolder(workspaceName);

      // 1. Fetch remote files list in the folder
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const listRes = await this.driveFetch(`files?q=${query}&fields=files(id,name,modifiedTime,size)`);
      const driveList = await listRes.json();
      const remoteFiles: Array<{ id: string; name: string; modifiedTime: string }> =
        driveList.files || [];

      const remoteMap = new Map<string, { id: string; modifiedTime: number }>();
      for (const f of remoteFiles) {
        remoteMap.set(f.name, {
          id: f.id,
          modifiedTime: new Date(f.modifiedTime).getTime(),
        });
      }

      // 2. Fetch local notes
      const localFiles = await db.files.toArray();
      const localMap = new Map<string, VaultFile>();

      // Push local files to Drive
      for (const local of localFiles) {
        // Only sync text markdown files
        if (local.isBinary) continue;

        // Use clean filename (replacing / with -- to preserve hierarchy in flat drive folder)
        const driveFileName = local.path.replace(/\//g, '___');
        localMap.set(driveFileName, local);

        const remote = remoteMap.get(driveFileName);

        if (!remote) {
          // Upload new file to Drive
          await this.uploadFile(folderId, driveFileName, local.content);
          stats.uploaded++;
        } else if (local.updatedAt > remote.modifiedTime + 2000) {
          // Local is newer -> update Drive file
          await this.updateFile(remote.id, local.content);
          stats.uploaded++;
        } else {
          stats.skipped++;
        }
      }

      // Pull new or newer remote files from Drive to local
      for (const [remoteName, remoteInfo] of remoteMap.entries()) {
        const local = localMap.get(remoteName);

        if (!local || remoteInfo.modifiedTime > local.updatedAt + 2000) {
          // Fetch remote content
          const contentRes = await this.driveFetch(`files/${remoteInfo.id}?alt=media`);
          const textContent = await contentRes.text();

          const reconstructedPath = remoteName.replace(/___/g, '/');
          const fileName = reconstructedPath.split('/').pop() || reconstructedPath;
          const title = fileName.replace(/\.[^/.]+$/, '');

          const noteRecord: VaultFile = {
            id: reconstructedPath,
            path: reconstructedPath,
            name: fileName,
            title,
            extension: fileName.split('.').pop() || 'md',
            content: textContent,
            frontmatter: {},
            tags: ['drive-synced'],
            isBinary: false,
            size: textContent.length,
            createdAt: remoteInfo.modifiedTime,
            updatedAt: remoteInfo.modifiedTime,
            vaultId: 'default-vault',
          };

          await db.files.put(noteRecord);
          stats.downloaded++;
        }
      }

      this.lastSyncTime = Date.now();

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

  /**
   * Upload a new text file to Google Drive using multipart upload
   */
  private static async uploadFile(folderId: string, name: string, content: string): Promise<string> {
    const token = await getAccessToken();
    const metadata = {
      name,
      parents: [folderId],
      mimeType: 'text/markdown',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/markdown\r\n\r\n' +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to upload ${name}: ${err}`);
    }

    const data = await res.json();
    return data.id;
  }

  /**
   * Update existing file content on Google Drive
   */
  private static async updateFile(fileId: string, content: string): Promise<void> {
    const token = await getAccessToken();
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/markdown',
      },
      body: content,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update file ${fileId}: ${err}`);
    }
  }

  public static getCachedStatus(): Partial<DriveSyncStatus> {
    return {
      folderId: this.cachedFolderId,
      lastSyncedAt: this.lastSyncTime,
    };
  }
}
