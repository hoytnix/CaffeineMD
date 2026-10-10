'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import { getAccessToken } from '@/src/lib/firebase/client';

/**
 * Strict chunk sizing parameters adhering to Google Drive's Resumable Upload specification
 * (multiples of 256 KB / 262,144 bytes).
 * 5 MB = 5,242,880 bytes = exactly 20 * 256 KB blocks.
 */
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5,242,880 bytes
export const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5,242,880 bytes

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);
const pdfExtensions = new Set(['pdf']);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFileBlob(file: VaultFile): Blob {
  if (file.blob) {
    return file.blob;
  }
  if (file.isBinary && file.content && file.content.startsWith('data:')) {
    try {
      const [header, base64] = file.content.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || file.mimeType || 'application/octet-stream';
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch {
      // Fallback below if data URI decode fails
    }
  }
  return new Blob([file.content || ''], {
    type: file.mimeType || (file.extension === 'md' ? 'text/markdown; charset=UTF-8' : 'text/plain; charset=UTF-8'),
  });
}

/**
 * Single-request multipart upload for files under 5 MB.
 * Sends metadata and content in a single round-trip without resumable session overhead.
 */
export async function uploadSmallFile(
  accessToken: string,
  fileMetadata: Record<string, any>,
  fileBlob: Blob,
  parentFolderId?: string,
  fileId?: string
): Promise<string> {
  const targetId = fileId || (fileMetadata as any)?.id;
  const isUpdate = Boolean(targetId);

  const endpoint = isUpdate
    ? `https://www.googleapis.com/upload/drive/v3/files/${targetId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const metadata: Record<string, any> = { ...fileMetadata };
  delete metadata.id;

  if (!isUpdate && parentFolderId && !metadata.parents) {
    metadata.parents = [parentFolderId];
  }

  const mimeType = metadata.mimeType || fileBlob.type || 'application/octet-stream';
  if (isUpdate) {
    delete metadata.parents;
    delete metadata.mimeType;
  } else {
    metadata.mimeType = mimeType;
  }

  const boundary = '-------KiteSyncBoundary' + Math.random().toString(36).slice(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const multipartBlob = new Blob([metadataPart, fileBlob, closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const maxRetries = 5;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBlob,
      });

      if (res.ok) {
        try {
          const data = await res.json();
          return data?.id || targetId || '';
        } catch {
          return targetId || '';
        }
      }

      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) {
          const errText = await res.text();
          throw new Error(`Small file upload failed after ${maxRetries} retries (${res.status}): ${errText}`);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30000);
        await wait(delay);
        continue;
      }

      const errText = await res.text();
      throw new Error(`Small file upload failed (${res.status}): ${errText}`);
    } catch (err: any) {
      if (err.message && err.message.startsWith('Small file upload failed')) {
        throw err;
      }
      if (attempt === maxRetries) {
        throw new Error(`Small file upload network error after ${maxRetries} retries: ${err.message}`);
      }
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30000);
      await wait(delay);
    }
  }

  throw new Error('Small file upload failed unexpectedly.');
}

/**
 * Resumable 5 MB chunked upload for files >= 5 MB.
 * Initiates resumable session, slices into 5 MB chunks, and handles 308 Resume Incomplete with backoff.
 */
export async function uploadLargeFileResumable(
  accessToken: string,
  fileMetadata: Record<string, any>,
  fileBlob: Blob,
  parentFolderId?: string,
  fileId?: string
): Promise<string> {
  const targetId = fileId || (fileMetadata as any)?.id;
  const isUpdate = Boolean(targetId);

  const initEndpoint = isUpdate
    ? `https://www.googleapis.com/upload/drive/v3/files/${targetId}?uploadType=resumable`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

  const metadata: Record<string, any> = { ...fileMetadata };
  delete metadata.id;

  if (!isUpdate && parentFolderId && !metadata.parents) {
    metadata.parents = [parentFolderId];
  }

  const mimeType = metadata.mimeType || fileBlob.type || 'application/octet-stream';
  if (isUpdate) {
    delete metadata.parents;
    delete metadata.mimeType;
  } else {
    metadata.mimeType = mimeType;
  }
  const totalBytes = fileBlob.size;

  // Step 1: Initiate session with exponential backoff
  let sessionUri = '';
  const maxRetries = 5;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const initRes = await fetch(initEndpoint, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': totalBytes.toString(),
        },
        body: JSON.stringify(metadata),
      });

      if (initRes.ok) {
        const location = initRes.headers.get('Location') || initRes.headers.get('location');
        if (!location) {
          throw new Error('Resumable upload session initiation missing Location header');
        }
        sessionUri = location;
        break;
      }

      if (initRes.status === 429 || initRes.status >= 500) {
        if (attempt === maxRetries) {
          const errText = await initRes.text();
          throw new Error(`Resumable session initiation failed after ${maxRetries} retries (${initRes.status}): ${errText}`);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30000);
        await wait(delay);
        continue;
      }

      const errText = await initRes.text();
      throw new Error(`Resumable session initiation failed (${initRes.status}): ${errText}`);
    } catch (err: any) {
      if (err.message && err.message.startsWith('Resumable session initiation failed')) {
        throw err;
      }
      if (attempt === maxRetries) {
        throw new Error(`Resumable session initiation network failure after ${maxRetries} retries: ${err.message}`);
      }
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30000);
      await wait(delay);
    }
  }

  if (!sessionUri) {
    throw new Error('Failed to obtain resumable upload session URI');
  }

  // Step 2: Slice and stream in 5 MB increments
  let start = 0;
  let finalFileId = targetId || '';

  while (start < totalBytes) {
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const chunk = fileBlob.slice(start, end);
    const chunkLength = chunk.size;
    const contentRange = `bytes ${start}-${end - 1}/${totalBytes}`;

    let chunkAttempt = 0;
    let chunkCompleted = false;

    while (chunkAttempt <= maxRetries && !chunkCompleted) {
      try {
        const chunkRes = await fetch(sessionUri, {
          method: 'PUT',
          headers: {
            'Content-Length': chunkLength.toString(),
            'Content-Range': contentRange,
          },
          body: chunk,
        });

        if (chunkRes.status === 308) {
          // 308 Resume Incomplete - advance start
          const rangeHeader = chunkRes.headers.get('Range') || chunkRes.headers.get('range');
          if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            if (match) {
              start = parseInt(match[1], 10) + 1;
            } else {
              start = end;
            }
          } else {
            start = end;
          }
          chunkCompleted = true;
        } else if (chunkRes.status === 200 || chunkRes.status === 201) {
          // Successful upload completion
          try {
            const data = await chunkRes.json();
            finalFileId = data?.id || finalFileId;
          } catch {
            // Response body might be empty in some HTTP implementations
          }
          start = totalBytes;
          chunkCompleted = true;
        } else if (chunkRes.status === 429 || chunkRes.status >= 500) {
          chunkAttempt++;
          if (chunkAttempt > maxRetries) {
            const errText = await chunkRes.text();
            throw new Error(`Chunk upload failed after ${maxRetries} retries (${chunkRes.status}): ${errText}`);
          }
          const delay = Math.min(1000 * Math.pow(2, chunkAttempt) + Math.random() * 500, 30000);
          await wait(delay);
        } else {
          const errText = await chunkRes.text();
          throw new Error(`Chunk upload failed with unrecoverable HTTP error (${chunkRes.status}): ${errText}`);
        }
      } catch (err: any) {
        if (err.message && err.message.startsWith('Chunk upload failed')) {
          throw err;
        }
        chunkAttempt++;
        if (chunkAttempt > maxRetries) {
          throw new Error(`Chunk upload failed due to network error after ${maxRetries} retries: ${err.message}`);
        }
        const delay = Math.min(1000 * Math.pow(2, chunkAttempt) + Math.random() * 500, 30000);
        await wait(delay);

        // Interruption recovery: query session status to verify received bytes
        try {
          const queryRes = await fetch(sessionUri, {
            method: 'PUT',
            headers: {
              'Content-Range': `bytes */${totalBytes}`,
            },
          });
          if (queryRes.status === 308) {
            const rangeHeader = queryRes.headers.get('Range') || queryRes.headers.get('range');
            if (rangeHeader) {
              const match = rangeHeader.match(/bytes=0-(\d+)/);
              if (match) {
                start = parseInt(match[1], 10) + 1;
                chunkCompleted = true;
              }
            }
          } else if (queryRes.status === 200 || queryRes.status === 201) {
            try {
              const data = await queryRes.json();
              finalFileId = data?.id || finalFileId;
            } catch {
              // Body empty
            }
            start = totalBytes;
            chunkCompleted = true;
          }
        } catch {
          // query check failed, will retry at next attempt
        }
      }
    }
  }

  return finalFileId;
}

/**
 * Dispatcher: routes files under 5 MB to uploadSmallFile and files >= 5 MB to uploadLargeFileResumable.
 */
export async function syncFileToDrive(
  accessToken: string,
  fileMetadata: Record<string, any>,
  fileBlob: Blob,
  parentFolderId?: string,
  fileId?: string
): Promise<string> {
  if (fileBlob.size < SMALL_FILE_THRESHOLD) {
    return uploadSmallFile(accessToken, fileMetadata, fileBlob, parentFolderId, fileId);
  } else {
    return uploadLargeFileResumable(accessToken, fileMetadata, fileBlob, parentFolderId, fileId);
  }
}

export interface RemoteWorkspace {
  id: string;
  name: string;
  folderName: string;
  modifiedTime?: string;
}

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
  public static readonly CHUNK_SIZE = CHUNK_SIZE;
  public static readonly SMALL_FILE_THRESHOLD = SMALL_FILE_THRESHOLD;

  public static uploadSmallFile = uploadSmallFile;
  public static uploadLargeFileResumable = uploadLargeFileResumable;
  public static syncFileToDrive = syncFileToDrive;

  private static folderCache: Map<string, string> = new Map(); // workspaceName -> folderId
  private static lastSyncTime: number | null = null;
  private static cachedFolderId: string | null = null;

  public static setWorkspaceFolder(workspaceName: string, folderId: string) {
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.folderCache.set(safeName, folderId);
    this.folderCache.set(workspaceName, folderId);
    this.cachedFolderId = folderId;
  }

  /**
   * List all Kite workspace folders available in Google Drive
   */
  public static async listRemoteWorkspaces(): Promise<RemoteWorkspace[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
      const query = encodeURIComponent(
        `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains 'Kite'`
      );
      const res = await this.driveFetch(
        `files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`
      );
      const data = await res.json();
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
  public static async syncNow(
    workspaceName: string,
    targetFolderId?: string,
    targetWorkspaceId?: string
  ): Promise<DriveSyncStatus> {
    const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Google Drive access token is not available. Please sign in with Google first.');
      }

      const folderId = targetFolderId || (await this.getOrCreateWorkspaceFolder(workspaceName));
      this.setWorkspaceFolder(workspaceName, folderId);

      const currentWorkspaceId =
        targetWorkspaceId ||
        (workspaceName === 'Local Vault'
          ? 'default-vault'
          : `drive-${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);

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

      // 2. Fetch local notes for this workspace
      const allLocal = await db.files.toArray();
      const localFiles =
        currentWorkspaceId === 'default-vault'
          ? allLocal.filter((f) => !f.vaultId || f.vaultId === 'default-vault')
          : allLocal.filter((f) => f.vaultId === currentWorkspaceId);
      const localMap = new Map<string, VaultFile>();

      // Push local files to Drive
      for (const local of localFiles) {
        if (local.isTrash) continue;

        // Use clean filename (replacing / with ___ to preserve hierarchy in flat drive folder)
        const driveFileName = local.path.replace(/\//g, '___');
        localMap.set(driveFileName, local);

        const remote = remoteMap.get(driveFileName);
        const fileBlob = getFileBlob(local);
        const metadata = {
          name: driveFileName,
          mimeType: local.mimeType || fileBlob.type,
        };

        if (!remote) {
          // Upload new file to Drive
          await this.syncFileToDrive(token, metadata, fileBlob, folderId);
          stats.uploaded++;
        } else if (local.updatedAt > remote.modifiedTime + 2000) {
          // Local is newer -> update Drive file
          await this.syncFileToDrive(token, metadata, fileBlob, undefined, remote.id);
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

          const reconstructedPath = remoteName.replace(/___/g, '/');
          const fileName = reconstructedPath.split('/').pop() || reconstructedPath;
          const title = fileName.replace(/\.[^/.]+$/, '');
          const extension = fileName.split('.').pop()?.toLowerCase() || 'md';

          const isBinary =
            imageExtensions.has(extension) ||
            pdfExtensions.has(extension) ||
            !['md', 'markdown', 'txt', 'json', 'yaml', 'yml'].includes(extension);

          let textContent = '';
          let binaryBlob: Blob | undefined = undefined;
          let size = 0;

          if (isBinary) {
            const arrayBuffer = await contentRes.arrayBuffer();
            const mimeType =
              contentRes.headers.get('Content-Type') ||
              (extension === 'pdf' ? 'application/pdf' : `image/${extension}`);
            binaryBlob = new Blob([arrayBuffer], { type: mimeType });
            size = binaryBlob.size;
          } else {
            textContent = await contentRes.text();
            size = textContent.length;
          }

          const noteRecord: VaultFile = {
            id: reconstructedPath,
            path: reconstructedPath,
            name: fileName,
            title,
            extension,
            content: textContent,
            frontmatter: {},
            tags: ['drive-synced'],
            isBinary,
            blob: binaryBlob,
            mimeType: binaryBlob?.type,
            size,
            createdAt: remoteInfo.modifiedTime,
            updatedAt: remoteInfo.modifiedTime,
            vaultId: currentWorkspaceId,
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
   * Upload a file using the size dispatcher
   */
  public static async uploadFile(
    folderId: string,
    name: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    }
    const fileBlob =
      typeof contentOrBlob === 'string'
        ? new Blob([contentOrBlob], { type: mimeType || 'text/markdown; charset=UTF-8' })
        : contentOrBlob;
    return this.syncFileToDrive(
      token,
      { name, mimeType: mimeType || fileBlob.type || 'text/markdown' },
      fileBlob,
      folderId
    );
  }

  /**
   * Update an existing file using the size dispatcher
   */
  public static async updateFile(
    fileId: string,
    contentOrBlob: string | Blob,
    mimeType?: string
  ): Promise<string> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Drive access token is not available. Please sign in with Google first.');
    }
    const fileBlob =
      typeof contentOrBlob === 'string'
        ? new Blob([contentOrBlob], { type: mimeType || 'text/markdown; charset=UTF-8' })
        : contentOrBlob;
    return this.syncFileToDrive(
      token,
      { mimeType: mimeType || fileBlob.type || 'text/markdown' },
      fileBlob,
      undefined,
      fileId
    );
  }

  public static getCachedStatus(): Partial<DriveSyncStatus> {
    return {
      folderId: this.cachedFolderId,
      lastSyncedAt: this.lastSyncTime,
    };
  }
}
