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

export type DriveRemoteFile = RemoteDriveFile;

export const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export function getHeaders(contentType = 'application/json', token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an authenticated Google Drive v3 REST request
 */
export async function driveFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!accessToken) {
    throw new Error('Google Drive access token is not available.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);

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
 * Query files from Google Drive v3
 */
export async function fetchDriveFiles(
  accessToken: string,
  query: string,
  fields = 'files(id, name, mimeType, modifiedTime)',
  pageToken?: string
): Promise<{ files: any[]; nextPageToken?: string }> {
  const q = encodeURIComponent(query);
  const f = encodeURIComponent(fields);
  const page = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
  const res = await driveFetch(accessToken, `files?q=${q}&fields=${f}&pageSize=100${page}`);
  return res.json();
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<string> {
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await driveFetch(accessToken, 'files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });

  const data = await res.json();
  return data.id;
}

/**
 * Download UTF-8 text file content from Google Drive
 */
export async function downloadRemoteFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await driveFetch(accessToken, `files/${fileId}?alt=media`);
  return res.text();
}

export const downloadDriveMedia = downloadRemoteFile;

/**
 * Download binary media content from Google Drive
 */
export async function downloadRemoteBinary(
  accessToken: string,
  fileId: string
): Promise<{ arrayBuffer: ArrayBuffer; mimeType: string }> {
  const res = await driveFetch(accessToken, `files/${fileId}?alt=media`);
  const arrayBuffer = await res.arrayBuffer();
  const mimeType = res.headers.get('Content-Type') || 'application/octet-stream';
  return { arrayBuffer, mimeType };
}

/**
 * Single-request multipart upload for small files (< 5 MB)
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

export const uploadSimpleFile = uploadSmallFile;

/**
 * Move a remote file on Google Drive to Trash
 */
export async function trashRemoteFile(fileId: string, token?: string): Promise<void> {
  if (!fileId) return;

  let accessToken = token;
  if (!accessToken) {
    const { DriveAuthService } = await import('./driveAuthService');
    accessToken = (await DriveAuthService.getValidToken().catch(() => null)) || undefined;
  }

  if (!accessToken) {
    console.warn('Cannot trash remote file: no active Google Drive access token.');
    return;
  }

  try {
    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'PATCH',
      headers: getHeaders('application/json', accessToken),
      body: JSON.stringify({ trashed: true }),
    });

    if (res.status === 404) {
      // Remote file was already removed or trashed; ignore safely
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Google Drive API error trashing file ${fileId} (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.warn(`Network error trashing remote file ${fileId}:`, err);
  }
}
