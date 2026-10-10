export interface IngestedRawFile {
  relativePath: string;
  name: string;
  file: File;
}

export const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', '.obsidian', '.trash', '.vscode', '.idea']);
export const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

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
