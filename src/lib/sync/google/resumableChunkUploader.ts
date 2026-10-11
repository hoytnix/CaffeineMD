import { wait, uploadSmallFile } from './driveApiClient';

/**
 * Strict chunk sizing adhering to Google Drive's Resumable Upload specification
 * (multiples of 256 KB). 5 MB = exactly 20 * 256 KB blocks.
 */
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5,242,880 bytes
export const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5,242,880 bytes

/**
 * Initialize a resumable upload session and return the session upload URI
 */
export async function initiateResumableSession(
  accessToken: string,
  fileMetadata: Record<string, any>,
  totalBytes: number,
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

  const mimeType = metadata.mimeType || 'application/octet-stream';
  if (isUpdate) {
    delete metadata.parents;
    delete metadata.mimeType;
  } else {
    metadata.mimeType = mimeType;
  }

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
        return location;
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

  throw new Error('Failed to obtain resumable upload session URI');
}

/**
 * Upload large file with 5 MB chunk stream and 308 Resume Incomplete handling
 */
export async function uploadLargeFileResumable(
  accessToken: string,
  fileMetadata: Record<string, any>,
  fileBlob: Blob,
  parentFolderId?: string,
  fileId?: string,
  onProgress?: (progressFraction: number) => void
): Promise<string> {
  const targetId = fileId || (fileMetadata as any)?.id;
  const totalBytes = fileBlob.size;

  const sessionUri = await initiateResumableSession(
    accessToken,
    fileMetadata,
    totalBytes,
    parentFolderId,
    targetId
  );

  let start = 0;
  let finalFileId = targetId || '';
  const maxRetries = 5;

  while (start < totalBytes) {
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const chunk = fileBlob.slice(start, end);
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
          const rangeHeader = chunkRes.headers.get('Range') || chunkRes.headers.get('range');
          if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            start = match ? parseInt(match[1], 10) + 1 : end;
          } else {
            start = end;
          }
          chunkCompleted = true;
          onProgress?.(Math.min(start / totalBytes, 1));
        } else if (chunkRes.status === 200 || chunkRes.status === 201) {
          try {
            const data = await chunkRes.json();
            finalFileId = data?.id || finalFileId;
          } catch {
            // Empty response body
          }
          start = totalBytes;
          chunkCompleted = true;
          onProgress?.(1);
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
          throw new Error(`Chunk upload failed with HTTP error (${chunkRes.status}): ${errText}`);
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

        // Interruption recovery query
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
                onProgress?.(Math.min(start / totalBytes, 1));
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
            onProgress?.(1);
          }
        } catch {
          // Will retry next loop
        }
      }
    }
  }

  return finalFileId;
}

/**
 * Dispatcher: routes small files (<5 MB) to simple upload and large files to resumable chunked upload
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
