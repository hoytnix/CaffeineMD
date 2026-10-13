import { db, VaultFile } from '@/src/lib/storage/db';
import { blobToBase64 } from '@/src/lib/storage/repositories/assetRepository';
import type JSZip from 'jszip';

async function findAssetFile(src: string): Promise<VaultFile | null> {
  const clean = decodeURIComponent(src).trim().replace(/^\/+/, '');
  const fileName = clean.split('/').pop() || clean;

  const direct = await db.files.get(clean);
  if (direct && direct.isBinary && direct.blob) {
    return direct;
  }

  const allFiles = await db.files.toArray();
  const found = allFiles.find(
    (f) =>
      f.isBinary &&
      f.blob &&
      (f.path === clean ||
        f.name === fileName ||
        f.path.endsWith('/' + clean) ||
        f.path.endsWith('/' + fileName))
  );

  return found || null;
}

/**
 * Replaces all referenced local images with self-contained Base64 data URIs
 */
export async function inlineHtmlAssets(html: string): Promise<string> {
  let output = html;
  const imgRegex = /<img\b([^>]*?)\bsrc=(["'])(.*?)\2([^>]*?)>/gi;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    const fullTag = match[0];
    const beforeSrc = match[1];
    const quote = match[2];
    const src = match[3];
    const afterSrc = match[4];

    if (!src || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      continue;
    }

    try {
      const assetFile = await findAssetFile(src);
      if (assetFile && assetFile.blob) {
        const base64Url = await blobToBase64(assetFile.blob);
        const newTag = `<img${beforeSrc}src=${quote}${base64Url}${quote}${afterSrc}>`;
        output = output.replace(fullTag, newTag);
      }
    } catch (err) {
      console.warn(`Failed to inline asset "${src}":`, err);
    }
  }

  return output;
}

/**
 * Extracts referenced local images into the /assets/ folder of the PWA zip bundle,
 * rewrites src paths to ./assets/filename, and returns asset paths for precaching.
 */
export async function extractAndBundleZipAssets(
  html: string,
  assetsZipFolder: JSZip
): Promise<{ html: string; bundledAssetPaths: string[] }> {
  let output = html;
  const bundledAssetPaths: string[] = [];
  const imgRegex = /<img\b([^>]*?)\bsrc=(["'])(.*?)\2([^>]*?)>/gi;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    const fullTag = match[0];
    const beforeSrc = match[1];
    const quote = match[2];
    const src = match[3];
    const afterSrc = match[4];

    if (!src || src.startsWith('http://') || src.startsWith('https://')) {
      continue;
    }

    try {
      let blob: Blob | null = null;
      let filename = 'asset-' + Math.random().toString(36).slice(2, 8) + '.png';

      if (src.startsWith('data:')) {
        const parts = src.split(',');
        const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        filename = `data-asset-${bundledAssetPaths.length + 1}.${ext}`;
        const binary = atob(parts[1] || '');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        blob = new Blob([bytes], { type: mime });
      } else {
        const assetFile = await findAssetFile(src);
        if (assetFile && assetFile.blob) {
          blob = assetFile.blob;
          filename = assetFile.name || filename;
        }
      }

      if (blob) {
        assetsZipFolder.file(filename, blob);
        const relativePath = `./assets/${filename}`;
        const precachePath = `assets/${filename}`;
        if (!bundledAssetPaths.includes(precachePath)) {
          bundledAssetPaths.push(precachePath);
        }
        const newTag = `<img${beforeSrc}src=${quote}${relativePath}${quote}${afterSrc}>`;
        output = output.replace(fullTag, newTag);
      }
    } catch (err) {
      console.warn(`Failed to bundle zip asset "${src}":`, err);
    }
  }

  return { html: output, bundledAssetPaths };
}
