'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { FileText } from 'lucide-react';

interface BinaryAssetPreviewProps {
  file: VaultFile;
}

export function BinaryAssetPreview({ file }: BinaryAssetPreviewProps) {
  let previewUrl = '';
  if (file.blob) {
    previewUrl = URL.createObjectURL(file.blob);
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      <div className="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold">{file.name}</h1>
        <div className="text-xs text-neutral-400 mt-1">
          Path: {file.path} · Type: {file.mimeType} · Size: {(file.size / 1024).toFixed(1)} KB
        </div>
      </div>
      {file.mimeType?.startsWith('image/') && previewUrl ? (
        <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={file.name} className="max-w-full max-h-[600px] object-contain rounded-lg" />
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
          <FileText className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
          <div className="text-sm font-semibold">Binary Attachment</div>
          <div className="text-xs text-neutral-500 mt-1">{file.mimeType}</div>
        </div>
      )}
    </div>
  );
}
