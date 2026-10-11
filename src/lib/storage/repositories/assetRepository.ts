import { db, VaultFile } from '../schema';

/**
 * Store a binary media asset (image, PDF, attachment) in IndexedDB
 */
export async function storeAsset(
  vaultId: string,
  path: string,
  blob: Blob,
  mimeType?: string
): Promise<VaultFile> {
  const fileName = path.split('/').pop() || path;
  const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const effectiveMime = mimeType || blob.type || 'application/octet-stream';
  const now = Date.now();

  const record: VaultFile = {
    id: path,
    path,
    name: fileName,
    title: fileName,
    extension,
    content: '',
    frontmatter: {},
    tags: ['asset'],
    isBinary: true,
    blob,
    mimeType: effectiveMime,
    size: blob.size,
    createdAt: now,
    updatedAt: now,
    vaultId,
  };

  await db.files.put(record);
  return record;
}

/**
 * Retrieve an asset by path
 */
export async function getAsset(
  path: string
): Promise<{ blob?: Blob; mimeType?: string; name: string } | null> {
  const record = await db.files.get(path);
  if (!record || !record.isBinary) return null;
  return {
    blob: record.blob,
    mimeType: record.mimeType,
    name: record.name,
  };
}

/**
 * Delete an asset from IndexedDB
 */
export async function deleteAsset(path: string): Promise<void> {
  await db.files.delete(path);
}

/**
 * Convert a Blob into an ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Convert an ArrayBuffer into a typed Blob
 */
export function arrayBufferToBlob(
  buffer: ArrayBuffer,
  mimeType = 'application/octet-stream'
): Blob {
  return new Blob([buffer], { type: mimeType });
}

/**
 * Convert base64 string or data URL to Blob
 */
export function base64ToBlob(
  base64OrDataUrl: string,
  fallbackMime = 'application/octet-stream'
): Blob {
  let base64 = base64OrDataUrl;
  let mimeType = fallbackMime;

  if (base64OrDataUrl.startsWith('data:')) {
    const parts = base64OrDataUrl.split(',');
    const header = parts[0];
    base64 = parts[1] || '';
    const match = header.match(/:(.*?);/);
    if (match) {
      mimeType = match[1];
    }
  }

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Convert Blob to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
