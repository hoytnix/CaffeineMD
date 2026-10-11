'use client';

import React, { useRef, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useVaultMounting } from '@/src/hooks/useVaultMounting';
import { DropzoneUploadCards } from './DropzoneUploadCards';
import { UploadCloud, X } from 'lucide-react';

interface VaultDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VaultDropzone({ isOpen, onClose }: VaultDropzoneProps) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleOpenLocalDiskFolder,
    handleFolderInputUpload,
    handleFileInputUpload,
    handleDroppedItems,
  } = useVaultMounting({ onClose, setStatusMessage, targetWorkspaceId: activeWorkspaceId });

  if (!isOpen) return null;

  // Drag & Drop Area Handlers
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

    await handleDroppedItems(items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
        <DropzoneUploadCards
          onOpenLocalDiskFolder={handleOpenLocalDiskFolder}
          folderInputRef={folderInputRef}
          fileInputRef={fileInputRef}
          onFolderInputUpload={handleFolderInputUpload}
          onFileInputUpload={handleFileInputUpload}
        />
      </div>
    </div>
  );
}
