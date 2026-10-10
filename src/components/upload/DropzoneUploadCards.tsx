'use client';

import React from 'react';
import { HardDrive, FolderUp, FilePlus } from 'lucide-react';

interface DropzoneUploadCardsProps {
  onOpenLocalDiskFolder: () => void;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFolderInputUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileInputUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DropzoneUploadCards({
  onOpenLocalDiskFolder,
  folderInputRef,
  fileInputRef,
  onFolderInputUpload,
  onFileInputUpload,
}: DropzoneUploadCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* Method 1: File System Access API */}
        <button
          onClick={onOpenLocalDiskFolder}
          className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group cursor-pointer"
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
          className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group cursor-pointer"
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
          className="flex flex-col items-start p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-left transition-colors group cursor-pointer"
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
        onChange={onFolderInputUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".md,.markdown,.txt,image/*,.pdf"
        onChange={onFileInputUpload}
        className="hidden"
      />
    </>
  );
}
