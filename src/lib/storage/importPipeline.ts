import { db, VaultFile, BacklinkRecord } from './db';
import { parseMarkdownContent } from '../markdown/serializer';

export interface ImportProgress {
  scanned: number;
  parsed: number;
  indexed: number;
  skipped: number;
  currentFileName: string;
  isComplete: boolean;
  errors: string[];
}

export interface IngestedRawFile {
  relativePath: string;
  name: string;
  file: File;
}

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', '.obsidian', '.trash', '.vscode', '.idea']);
const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

/**
 * Normalizes file paths (removes leading slashes, backslashes to forward slashes)
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
}

/**
 * Recursive crawler for DataTransferItem (Drag-and-Drop) using webkitGetAsEntry
 */
export async function scanDroppedItems(
  dataTransferItems: DataTransferItemList,
  onScanProgress?: (count: number, currentItem: string) => void
): Promise<IngestedRawFile[]> {
  const fileList: IngestedRawFile[] = [];

  const traverseEntry = async (entry: any, pathPrefix = ''): Promise<void> => {
    if (!entry) return;

    if (IGNORED_DIRECTORIES.has(entry.name) || IGNORED_FILES.has(entry.name)) {
      return;
    }

    if (entry.isFile) {
      return new Promise<void>((resolve) => {
        entry.file(
          (file: File) => {
            const relPath = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
            fileList.push({
              relativePath: normalizePath(relPath),
              name: file.name,
              file,
            });
            if (onScanProgress) onScanProgress(fileList.length, relPath);
            resolve();
          },
          (err: any) => {
            console.warn(`Error reading file entry ${entry.name}:`, err);
            resolve();
          }
        );
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const entries: any[] = [];
        let batch: any[] = [];
        do {
          batch = await new Promise<any[]>((resolve) => {
            dirReader.readEntries(
              (results: any[]) => resolve(results),
              (err: any) => {
                console.warn(`Error reading directory reader ${entry.name}:`, err);
                resolve([]);
              }
            );
          });
          entries.push(...batch);
        } while (batch.length > 0);
        return entries;
      };

      const children = await readAllEntries();
      const nextPrefix = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
      for (const child of children) {
        await traverseEntry(child, nextPrefix);
      }
    }
  };

  const entryPromises: Promise<void>[] = [];
  for (let i = 0; i < dataTransferItems.length; i++) {
    const item = dataTransferItems[i];
    // @ts-ignore - webkitGetAsEntry is standard in Chromium/Safari/Firefox
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) {
      entryPromises.push(traverseEntry(entry, ''));
    } else {
      const file = item.getAsFile();
      if (file) {
        fileList.push({
          relativePath: normalizePath(file.name),
          name: file.name,
          file,
        });
      }
    }
  }

  await Promise.all(entryPromises);
  return fileList;
}

/**
 * Normalizes input files from `<input type="file" webkitdirectory>`
 */
export function processStandardFileInput(files: FileList): IngestedRawFile[] {
  const result: IngestedRawFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // webkitRelativePath gives "Folder/Sub/file.md"
    const relPath = (file as any).webkitRelativePath || file.name;
    const normalized = normalizePath(relPath);

    const parts = normalized.split('/');
    const isIgnored = parts.some((p) => IGNORED_DIRECTORIES.has(p) || IGNORED_FILES.has(p));
    if (!isIgnored) {
      result.push({
        relativePath: normalized,
        name: file.name,
        file,
      });
    }
  }

  return result;
}

/**
 * Main Batch Ingestion Pipeline
 * Takes raw files, parses text/markdown or extracts binary blobs,
 * indexes backlinks & tags, and commits in a single fast IndexedDB transaction.
 */
export async function runIngestionPipeline(
  rawFiles: IngestedRawFile[],
  vaultId = 'default-vault',
  onProgress?: (progress: ImportProgress) => void
): Promise<{ importedCount: number; errors: string[] }> {
  const progress: ImportProgress = {
    scanned: rawFiles.length,
    parsed: 0,
    indexed: 0,
    skipped: 0,
    currentFileName: '',
    isComplete: false,
    errors: [],
  };

  const parsedFiles: VaultFile[] = [];
  const backlinksToInsert: BacklinkRecord[] = [];
  const tagCounts: Map<string, number> = new Map();

  const textExtensions = new Set(['md', 'markdown', 'txt', 'text']);
  const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']);
  const pdfExtensions = new Set(['pdf']);

  for (const raw of rawFiles) {
    progress.currentFileName = raw.relativePath;
    if (onProgress) onProgress({ ...progress });

    const fileNameParts = raw.name.split('.');
    const ext = fileNameParts.length > 1 ? fileNameParts.pop()!.toLowerCase() : '';

    try {
      if (textExtensions.has(ext)) {
        // Read text content
        const textContent = await raw.file.text();
        const baseTitle = raw.name.replace(/\.[^/.]+$/, '');
        const parsed = parseMarkdownContent(textContent, baseTitle);

        const vaultFile: VaultFile = {
          id: raw.relativePath,
          path: raw.relativePath,
          name: raw.name,
          title: parsed.title,
          extension: ext,
          content: textContent,
          frontmatter: parsed.frontmatter,
          tags: parsed.tags,
          isBinary: false,
          size: raw.file.size,
          createdAt: raw.file.lastModified || Date.now(),
          updatedAt: raw.file.lastModified || Date.now(),
          vaultId,
        };
        parsedFiles.push(vaultFile);

        // Build backlinks
        for (const wl of parsed.wikiLinks) {
          const targetTitle = wl.target;
          backlinksToInsert.push({
            id: `${raw.relativePath}::${targetTitle}`,
            sourcePath: raw.relativePath,
            sourceTitle: parsed.title,
            targetTitle,
            snippet: wl.raw,
            vaultId,
          });
        }

        // Count tags
        for (const tag of parsed.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }

        progress.parsed++;
      } else if (imageExtensions.has(ext) || pdfExtensions.has(ext)) {
        // Store as binary blob
        const blob = raw.file.slice(0, raw.file.size, raw.file.type);
        const vaultFile: VaultFile = {
          id: raw.relativePath,
          path: raw.relativePath,
          name: raw.name,
          title: raw.name,
          extension: ext,
          content: '',
          frontmatter: {},
          tags: ['attachment'],
          isBinary: true,
          blob,
          mimeType: raw.file.type || (imageExtensions.has(ext) ? `image/${ext}` : 'application/pdf'),
          size: raw.file.size,
          createdAt: raw.file.lastModified || Date.now(),
          updatedAt: raw.file.lastModified || Date.now(),
          vaultId,
        };
        parsedFiles.push(vaultFile);
        progress.parsed++;
      } else {
        // Unsupported or arbitrary file type, skip gracefully
        progress.skipped++;
      }
    } catch (err: any) {
      console.warn(`Failed parsing ${raw.relativePath}:`, err);
      progress.errors.push(`${raw.relativePath}: ${err.message || 'Parse error'}`);
      progress.skipped++;
    }
  }

  // Commit everything in a single fast IndexedDB transaction
  await db.transaction('rw', [db.files, db.backlinks, db.tags], async () => {
    // 1. Bulk insert/put files
    for (const file of parsedFiles) {
      await db.files.put(file);
    }

    // 2. Clear old backlinks for these files and put new ones
    for (const bl of backlinksToInsert) {
      await db.backlinks.put(bl);
    }

    // 3. Update tag counts
    for (const [tag, count] of tagCounts.entries()) {
      const existing = await db.tags.get(tag);
      await db.tags.put({
        name: tag,
        count: (existing?.count || 0) + count,
      });
    }
  });

  progress.indexed = parsedFiles.length;
  progress.isComplete = true;
  if (onProgress) onProgress({ ...progress });

  return {
    importedCount: parsedFiles.length,
    errors: progress.errors,
  };
}
