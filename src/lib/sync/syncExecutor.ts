import { db, VaultFile } from '@/src/lib/storage/db';
import { parseFrontmatter, normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import {
  RemoteDriveFile,
  downloadRemoteFile,
  downloadRemoteBinary,
} from './google/driveApiClient';
import { syncFileToDrive } from './google/resumableChunkUploader';
import { UploadSyncTask } from './reconciler';

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);
const pdfExtensions = new Set(['pdf']);

export async function runWithConcurrency<T>(
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

export function getFileBlob(file: VaultFile): Blob {
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
      // Fallback below
    }
  }
  return new Blob([file.content || ''], {
    type: file.mimeType || (file.extension === 'md' ? 'text/markdown; charset=UTF-8' : 'text/plain; charset=UTF-8'),
  });
}

/**
 * Downloads a list of remote files in parallel and saves them atomically in Dexie
 */
export async function executeDownloadBatch(
  token: string,
  downloadTasks: RemoteDriveFile[],
  currentWorkspaceId: string,
  onProgress?: (text: string) => void,
  onFileProcessed?: (fileName: string, action: 'downloading' | 'uploading') => void
): Promise<number> {
  if (downloadTasks.length === 0) return 0;
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

    downloadedRecords.push({
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
      driveFileId: remote.id,
    });

    onFileProcessed?.(fileName, 'downloading');
  });

  if (downloadedRecords.length > 0) {
    await db.transaction('rw', db.files, async () => {
      for (const record of downloadedRecords) {
        const existing = await db.files.get(record.path);
        if (existing?.isDeleted || existing?.isTrash) {
          // Never overwrite or resurrect a soft-deleted note
          continue;
        }
        await db.files.put(record);
      }
    });
  }

  return downloadedRecords.length;
}

/**
 * Uploads a list of local files in parallel to Google Drive
 */
export async function executeUploadBatch(
  token: string,
  uploadTasks: UploadSyncTask[],
  folderId: string,
  onProgress?: (text: string) => void,
  onFileProcessed?: (fileName: string, action: 'downloading' | 'uploading') => void
): Promise<number> {
  if (uploadTasks.length === 0) return 0;
  onProgress?.(`Uploading ${uploadTasks.length} local notes...`);

  let count = 0;
  await runWithConcurrency(uploadTasks, 3, async (task) => {
    const fileBlob = getFileBlob(task.local);
    const metadata = {
      name: task.driveFileName,
      mimeType: task.local.mimeType || fileBlob.type,
    };
    const remoteId = await syncFileToDrive(
      token,
      metadata,
      fileBlob,
      task.remoteId ? undefined : folderId,
      task.remoteId
    );
    if (remoteId && task.local.path) {
      await db.files.update(task.local.path, { driveFileId: remoteId }).catch(() => {});
    }
    count++;
    const friendlyName = task.driveFileName.includes('___')
      ? task.driveFileName.replace(/___/g, '/')
      : task.driveFileName;
    onFileProcessed?.(friendlyName, 'uploading');
  });

  return count;
}
