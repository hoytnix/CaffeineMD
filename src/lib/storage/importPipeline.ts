import { VaultFile, BacklinkRecord } from './db';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  FRONTMATTER_REGEX,
} from '../markdown/serializer';
import { IngestedRawFile, normalizePath, scanDroppedItems, processStandardFileInput } from './entryCrawler';
import { commitIngestionBatch } from './batchIndexer';

export * from './entryCrawler';
export * from './batchIndexer';

export interface ImportProgress {
  scanned: number;
  parsed: number;
  indexed: number;
  skipped: number;
  currentFileName: string;
  isComplete: boolean;
  errors: string[];
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
        const textContent = await raw.file.text();
        const baseTitle = raw.name.replace(/\.[^/.]+$/, '');
        const parsed = parseMarkdownContent(textContent, baseTitle);

        const hasFrontmatter = FRONTMATTER_REGEX.test(textContent);
        const finalContent = hasFrontmatter
          ? textContent
          : serializeMarkdownWithFrontmatter(parsed.body, parsed.frontmatter);

        const vaultFile: VaultFile = {
          id: raw.relativePath,
          path: raw.relativePath,
          name: raw.name,
          title: parsed.title,
          extension: ext,
          content: finalContent,
          frontmatter: parsed.frontmatter,
          tags: parsed.tags,
          eisenhower: parsed.eisenhower,
          isBinary: false,
          size: finalContent.length,
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
        progress.skipped++;
      }
    } catch (err: any) {
      console.warn(`Failed parsing ${raw.relativePath}:`, err);
      progress.errors.push(`${raw.relativePath}: ${err.message || 'Parse error'}`);
      progress.skipped++;
    }
  }

  // Atomic batch commit
  await commitIngestionBatch(parsedFiles, backlinksToInsert, tagCounts);

  progress.indexed = parsedFiles.length;
  progress.isComplete = true;
  if (onProgress) onProgress({ ...progress });

  return {
    importedCount: parsedFiles.length,
    errors: progress.errors,
  };
}
