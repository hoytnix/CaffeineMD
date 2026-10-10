'use client';

import React, { useRef, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  scanDroppedItems,
  processStandardFileInput,
  runIngestionPipeline,
  IngestedRawFile,
} from '@/src/lib/storage/importPipeline';
import { FolderUp, UploadCloud, Folder, FilePlus, Sparkles, X, HardDrive } from 'lucide-react';

interface VaultDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaultDropzone({ isOpen, onClose }: VaultDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    setImportProgress,
    setMountedMode,
    setActiveFilePath,
    openFileTab,
  } = useWorkspaceStore();

  if (!isOpen) return null;

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

      const result = await runIngestionPipeline(rawFiles, 'default-vault', (progress) => {
        setImportProgress(progress);
      });

      if (rawFiles.length > 0) {
        openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
      }

      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(err.message || 'Could not mount directory');
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

  // 4. Drag & Drop Area Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight">Open or Import Knowledge Vault</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Mount a live disk folder, upload an existing Obsidian vault, or drop markdown folders with frontmatter.
          </p>
        </div>

        {/* Big Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/40'
          }`}
          onClick={() => folderInputRef.current?.click()}
        >
          <div className="p-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-indigo-600 shadow-xs mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-center">
            Drop entire folder hierarchy or files here
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center">
            Recursive scanning extracts YAML frontmatter, WikiLinks, and media attachments
          </div>
          {statusMessage && (
            <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Ingestion Method Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* Method 1: File System Access API */}
          <button
            onClick={handleOpenLocalDiskFolder}
            className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group"
          >
            <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 mb-2.5">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Live Disk Folder</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
              Direct File System API with in-place saving
            </div>
          </button>

          {/* Method 2: Folder Upload via webkitdirectory */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group"
          >
            <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 mb-2.5">
              <FolderUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Upload Folder</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
              Select any local directory tree from disk
            </div>
          </button>

          {/* Method 3: File Multi-select */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group"
          >
            <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 mb-2.5">
              <FilePlus className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Import Notes</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
              Batch select individual .md or asset files
            </div>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={folderInputRef}
          // @ts-ignore
          webkitdirectory="true"
          directory=""
          multiple
          onChange={handleFolderInputUpload}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".md,.markdown,.txt,image/*,.pdf"
          onChange={handleFileInputUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
