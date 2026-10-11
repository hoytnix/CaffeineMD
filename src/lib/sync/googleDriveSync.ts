'use client';

import { db, VaultFile } from '@/src/lib/storage/db';
import { getAccessToken } from '@/src/lib/firebase/client';
import { parseFrontmatter, normalizeEisenhower } from '@/src/lib/markdown/frontmatter';

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

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  workerFn: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await workerFn(item);
    }
  });
  await Promise.all(workers);
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

export interface RemoteDriveFile {
  id: string;
  name: string;
  relativePath: string;
  modifiedTime: string; // ISO string
  mimeType: string;
  md5Checksum?: string;
  size?: number;
}

/**
 * Recursively list all remote files in a Google Drive folder hierarchy,
 * supporting pagination via nextPageToken and flat relativePath mapping.
 */
export async function listAllRemoteFiles(
  accessToken: string,
  folderId: string,
  currentPath = ''
): Promise<Map<string, RemoteDriveFile>> {
  const fileMap = new Map<string, RemoteDriveFile>();

  const traverse = async (parentFolderId: string, prefix: string): Promise<void> => {
    let pageToken: string | undefined = undefined;

    do {
      const q = encodeURIComponent(`'${parentFolderId}' in parents and trashed = false`);
      const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, modifiedTime, md5Checksum, size)');
      const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const requestUrl: string = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100${pageParam}`;

      const res: Response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errText: string = await res.text();
        throw new Error(`Google Drive list files failed (${res.status}): ${errText}`);
      }

      const data: any = await res.json();
      const files: any[] = data.files || [];
      pageToken = data.nextPageToken;

      for (const f of files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          // Recursive traverse into subfolder
          const nextPrefix = prefix ? `${prefix}/${f.name}` : f.name;
          await traverse(f.id, nextPrefix);
        } else {
          // Support both nested paths and legacy flat ___ encoded paths
          let relativePath = prefix ? `${prefix}/${f.name}` : f.name;
          if (f.name.includes('___')) {
            relativePath = f.name.replace(/___/g, '/');
          }

          fileMap.set(relativePath, {
            id: f.id,
            name: f.name,
            relativePath,
            modifiedTime: f.modifiedTime,
            mimeType: f.mimeType,
            md5Checksum: f.md5Checksum,
            size: f.size ? parseInt(f.size, 10) : undefined,
          });
        }
      }
    } while (pageToken);
  };

  await traverse(folderId, currentPath);
  return fileMap;
}

/**
 * Downloads file content from Google Drive by file ID.
 */
export async function downloadRemoteFile(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download remote file (${res.status}): ${errText}`);
  }

  return res.text();
}

/**
 * Downloads binary file content from Google Drive by file ID.
 */
export async function downloadRemoteBinary(
  accessToken: string,
  fileId: string
): Promise<{ arrayBuffer: ArrayBuffer; mimeType: string }> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download remote binary (${res.status}): ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const mimeType = res.headers.get('Content-Type') || 'application/octet-stream';
  return { arrayBuffer, mimeType };
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
  public static listAllRemoteFiles = listAllRemoteFiles;
  public static downloadRemoteFile = downloadRemoteFile;
  public static downloadRemoteBinary = downloadRemoteBinary;

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
   * Create a new dedicated workspace folder in Google Drive and return its metadata
   */
  public static async createRemoteWorkspace(workspaceName: string): Promise<RemoteWorkspace> {
    const folderId = await this.getOrCreateWorkspaceFolder(workspaceName);
    const safeName = `Kite-${workspaceName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    this.setWorkspaceFolder(workspaceName, folderId);
    return {
      id: folderId,
      name: workspaceName,
      folderName: safeName,
    };
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
   * Perform bidirectional synchronization between local Dexie notes and Google Drive.
   * Performs recursive remote discovery, two-way diffing, timestamp conflict resolution,
   * batch transactional Dexie writes, and concurrency-limited network calls.
   */
  public static async syncNow(
    workspaceName: string,
    targetFolderId?: string,
    targetWorkspaceId?: string,
    onProgress?: (statusText: string) => void
  ): Promise<DriveSyncStatus> {
    const stats = { uploaded: 0, downloaded: 0, skipped: 0 };

    try {
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

      // 1. Fetch remote files recursively (supporting subfolders & pagination)
      onProgress?.('Scanning Google Drive for remote files...');
      const remoteMap = await listAllRemoteFiles(token, folderId);

      // 2. Fetch local notes for this workspace
      onProgress?.('Analyzing local workspace notes...');
      const allLocal = await db.files.toArray();
      const localFiles =
        currentWorkspaceId === 'default-vault'
          ? allLocal.filter((f) => !f.vaultId || f.vaultId === 'default-vault')
          : allLocal.filter((f) => f.vaultId === currentWorkspaceId);

      // Build local map indexed by relative path (normalized with forward slashes)
      const localMap = new Map<string, VaultFile>();
      for (const local of localFiles) {
        if (local.isTrash) continue;
        const normalizedLocalPath = local.path.replace(/\\/g, '/').replace(/^\/+/, '');
        localMap.set(normalizedLocalPath, local);
      }

      // 3. Classify actions: Uploads, Downloads, Skips with 2-second tolerance threshold
      const TIME_TOLERANCE_MS = 2000;

      const uploadTasks: Array<{
        local: VaultFile;
        driveFileName: string;
        remoteId?: string;
      }> = [];

      const downloadTasks: Array<RemoteDriveFile> = [];

      // Check local files against remote
      for (const [localPath, local] of localMap.entries()) {
        const driveFileName = localPath.replace(/\//g, '___');
        const remote = remoteMap.get(localPath) || remoteMap.get(driveFileName);

        if (!remote) {
          // Local exists, remote missing -> Upload new file
          uploadTasks.push({ local, driveFileName, remoteId: undefined });
        } else {
          const remoteTime = new Date(remote.modifiedTime).getTime();
          const localTime = local.updatedAt;

          if (localTime - remoteTime > TIME_TOLERANCE_MS) {
            // Local is newer by more than 2s -> Upload updated content
            uploadTasks.push({ local, driveFileName, remoteId: remote.id });
          } else if (remoteTime - localTime > TIME_TOLERANCE_MS) {
            // Remote is newer by more than 2s -> Download updated content
            downloadTasks.push(remote);
          } else {
            // Timestamps match within tolerance -> Skip
            stats.skipped++;
          }
        }
      }

      // Check remote files that do not exist locally
      for (const [remotePath, remote] of remoteMap.entries()) {
        const altFlatPath = remotePath.replace(/___/g, '/');
        const local = localMap.get(remotePath) || localMap.get(altFlatPath);

        if (!local) {
          // Remote exists, local missing -> Enqueue for download
          downloadTasks.push(remote);
        }
      }

      // 4. Execute downloads in pooled concurrency (3-4 workers) with batch transactions
      if (downloadTasks.length > 0) {
        onProgress?.(`Downloading ${downloadTasks.length} remote files...`);

        const downloadedRecords: VaultFile[] = [];

        await runWithConcurrency(downloadTasks, 3, async (remote) => {
          const reconstructedPath = remote.relativePath.includes('___')
            ? remote.relativePath.replace(/___/g, '/')
            : remote.relativePath;

          const fileName = reconstructedPath.split('/').pop() || reconstructedPath;
          const title = fileName.replace(/\.[^/.]+$/, '');
          const extension = fileName.split('.').pop()?.toLowerCase() || 'md';

          const isBinary =
            imageExtensions.has(extension) ||
            pdfExtensions.has(extension) ||
            !['md', 'markdown', 'txt', 'json', 'yaml', 'yml'].includes(extension);

          const remoteModifiedMs = new Date(remote.modifiedTime).getTime();

          let textContent = '';
          let binaryBlob: Blob | undefined = undefined;
          let parsedFrontmatter: Record<string, any> = {};
          let tags: string[] = ['drive-synced'];
          let size = 0;

          if (isBinary) {
            const { arrayBuffer, mimeType } = await downloadRemoteBinary(token, remote.id);
            binaryBlob = new Blob([arrayBuffer], { type: mimeType });
            size = binaryBlob.size;
          } else {
            textContent = await downloadRemoteFile(token, remote.id);
            size = textContent.length;

            if (extension === 'md' || extension === 'markdown') {
              const parsed = parseFrontmatter(textContent);
              parsedFrontmatter = parsed;
              if (parsed.tags && Array.isArray(parsed.tags)) {
                tags = Array.from(new Set([...tags, ...parsed.tags]));
              }
            }
          }

          const noteRecord: VaultFile = {
            id: reconstructedPath,
            path: reconstructedPath,
            name: fileName,
            title: (parsedFrontmatter.title as string) || title,
            extension,
            content: textContent,
            frontmatter: parsedFrontmatter,
            tags,
            eisenhower: normalizeEisenhower(parsedFrontmatter.eisenhower),
            isBinary,
            blob: binaryBlob,
            mimeType: binaryBlob?.type,
            size,
            createdAt: remoteModifiedMs,
            updatedAt: remoteModifiedMs,
            vaultId: currentWorkspaceId,
          };

          downloadedRecords.push(noteRecord);
          stats.downloaded++;
        });

        // Write batch atomically inside a transaction to prevent UI jitter in FileTree
        if (downloadedRecords.length > 0) {
          await db.transaction('rw', db.files, async () => {
            for (const record of downloadedRecords) {
              await db.files.put(record);
            }
          });
        }
      }

      // 5. Execute uploads in pooled concurrency (3-4 workers)
      if (uploadTasks.length > 0) {
        onProgress?.(`Uploading ${uploadTasks.length} local notes...`);

        await runWithConcurrency(uploadTasks, 3, async (task) => {
          const fileBlob = getFileBlob(task.local);
          const metadata = {
            name: task.driveFileName,
            mimeType: task.local.mimeType || fileBlob.type,
          };
          await GoogleDriveSyncService.syncFileToDrive(
            token,
            metadata,
            fileBlob,
            task.remoteId ? undefined : folderId,
            task.remoteId
          );
          stats.uploaded++;
        });
      }

      this.lastSyncTime = Date.now();
      onProgress?.('Synced');

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
