/**
 * File System Access API Adapter
 * Enables direct mounting and live in-place read/write of local disk directories
 */

export interface DiskMountedFile {
  path: string;
  name: string;
  handle: FileSystemFileHandle;
  file: File;
}

export class NativeFileSystemAdapter {
  private static rootHandle: FileSystemDirectoryHandle | null = null;
  private static fileHandlesMap: Map<string, FileSystemFileHandle> = new Map();

  /**
   * Check if File System Access API is supported in the current environment
   */
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  /**
   * Prompt user to pick a local disk directory and return root handle
   */
  public static async pickDirectory(): Promise<{
    handle: FileSystemDirectoryHandle;
    name: string;
  }> {
    if (!this.isSupported()) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    // @ts-ignore - showDirectoryPicker is standard in modern Chromium/Edge
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    this.rootHandle = handle;
    this.fileHandlesMap.clear();

    return {
      handle,
      name: handle.name,
    };
  }

  public static getRootHandle(): FileSystemDirectoryHandle | null {
    return this.rootHandle;
  }

  /**
   * Recursively crawl a FileSystemDirectoryHandle and return all files with relative paths
   */
  public static async scanDirectory(
    dirHandle: FileSystemDirectoryHandle,
    currentPath = '',
    onProgress?: (scannedCount: number, currentItem: string) => void
  ): Promise<DiskMountedFile[]> {
    const results: DiskMountedFile[] = [];
    const ignoreNames = new Set(['.git', '.DS_Store', 'node_modules', 'Thumbs.db', '.obsidian', '.trash']);

    async function traverse(handle: FileSystemDirectoryHandle, pathPrefix: string) {
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (ignoreNames.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }

        const relativePath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;

        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          results.push({
            path: relativePath,
            name: entry.name,
            handle: fileHandle,
            file,
          });
          NativeFileSystemAdapter.fileHandlesMap.set(relativePath, fileHandle);
          if (onProgress) {
            onProgress(results.length, relativePath);
          }
        } else if (entry.kind === 'directory') {
          await traverse(entry as FileSystemDirectoryHandle, relativePath);
        }
      }
    }

    await traverse(dirHandle, currentPath);
    return results;
  }

  /**
   * Write content directly back to the local disk file if mounted
   */
  public static async writeBackToFile(path: string, content: string | Blob): Promise<boolean> {
    const handle = this.fileHandlesMap.get(path);
    if (!handle) {
      return false; // Not mounted via native FSAA or file newly created in app
    }

    try {
      // Check query permission or create writable
      // @ts-ignore
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      console.warn(`Could not write directly to disk handle for ${path}:`, err);
      return false;
    }
  }

  /**
   * Create a new file in the mounted root directory
   */
  public static async createNewFileOnDisk(relativePath: string, content: string): Promise<boolean> {
    if (!this.rootHandle) return false;

    try {
      const parts = relativePath.split('/');
      let currentDir = this.rootHandle;

      // Ensure subdirectories exist
      for (let i = 0; i < parts.length - 1; i++) {
        const subDirName = parts[i];
        if (!subDirName) continue;
        currentDir = await currentDir.getDirectoryHandle(subDirName, { create: true });
      }

      const fileName = parts[parts.length - 1];
      const newFileHandle = await currentDir.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      this.fileHandlesMap.set(relativePath, newFileHandle);
      return true;
    } catch (err) {
      console.warn(`Failed to create disk file ${relativePath}:`, err);
      return false;
    }
  }
}
