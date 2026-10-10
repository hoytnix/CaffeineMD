'use client';

import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  scanDroppedItems,
  processStandardFileInput,
  runIngestionPipeline,
  IngestedRawFile,
} from '@/src/lib/storage/importPipeline';

interface UseVaultMountingProps {
  onClose: () => void;
  setStatusMessage: (msg: string | null) => void;
}

export function useVaultMounting({ onClose, setStatusMessage }: UseVaultMountingProps) {
  const {
    setImportProgress,
    setMountedMode,
    openFileTab,
  } = useWorkspaceStore();

  // 1. Native Directory Picker (File System Access API)
  const handleOpenLocalDiskFolder = async () => {
    try {
      setStatusMessage('Requesting local directory permission...');
      const { handle, name } = await NativeFileSystemAdapter.pickDirectory();
      setStatusMessage(`Scanning files in ${name}...`);

      const diskFiles = await NativeFileSystemAdapter.scanDirectory(
        handle,
        '',
        (count, current) => {
          setStatusMessage(`Found ${count} files (${current})...`);
        }
      );

      const rawFiles: IngestedRawFile[] = diskFiles.map((df) => ({
        relativePath: df.path,
        name: df.name,
        file: df.file,
      }));

      setMountedMode('filesystem', name);
      setStatusMessage(`Ingesting ${rawFiles.length} files...`);

      await runIngestionPipeline(rawFiles, 'default-vault', (progress) => {
        setImportProgress(progress);
      });

      if (rawFiles.length > 0) {
        openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
      }

      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Could not mount directory:', err.message);
      }
      setStatusMessage(null);
    }
  };

  // 2. Standard Folder Upload (webkitdirectory fallback)
  const handleFolderInputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatusMessage(`Preparing ${files.length} folder files...`);
    const rawFiles = processStandardFileInput(files);

    const firstFolder = rawFiles[0]?.relativePath.split('/')[0] || 'Imported Vault';
    setMountedMode('indexeddb', firstFolder);

    await runIngestionPipeline(rawFiles, 'default-vault', (progress) => {
      setImportProgress(progress);
    });

    if (rawFiles.length > 0) {
      openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
    }

    onClose();
  };

  // 3. Standard Multiple Files Upload
  const handleFileInputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rawFiles: IngestedRawFile[] = Array.from(files).map((f) => ({
      relativePath: f.name,
      name: f.name,
      file: f,
    }));

    await runIngestionPipeline(rawFiles, 'default-vault', (progress) => {
      setImportProgress(progress);
    });

    if (rawFiles.length > 0) {
      openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
    }

    onClose();
  };

  // 4. Ingest Dropped Items
  const handleDroppedItems = async (items: DataTransferItemList) => {
    setStatusMessage('Traversing dropped folder hierarchy...');
    const rawFiles = await scanDroppedItems(items, (count, current) => {
      setStatusMessage(`Discovered ${count} files: ${current}...`);
    });

    if (rawFiles.length === 0) {
      setStatusMessage('No supported markdown or attachment files found.');
      return;
    }

    const firstPath = rawFiles[0].relativePath;
    const folderName = firstPath.includes('/') ? firstPath.split('/')[0] : 'Dropped Files';
    setMountedMode('indexeddb', folderName);

    await runIngestionPipeline(rawFiles, 'default-vault', (progress) => {
      setImportProgress(progress);
    });

    if (rawFiles.length > 0) {
      openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
    }

    onClose();
  };

  return {
    handleOpenLocalDiskFolder,
    handleFolderInputUpload,
    handleFileInputUpload,
    handleDroppedItems,
  };
}
