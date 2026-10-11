'use client';

import React from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Music, Video, ShieldCheck } from 'lucide-react';

export interface EditorDragOverlayProps {
  isDraggingOver: boolean;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const SUPPORTED_ASSET_TYPES = [
  {
    icon: ImageIcon,
    label: 'Images',
    formats: 'PNG, JPG, SVG, WebP, GIF',
    badgeClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: FileText,
    label: 'Markdown & Documents',
    formats: 'MD, TXT, PDF, JSON',
    badgeClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Music,
    label: 'Audio Tracks',
    formats: 'MP3, WAV, M4A, OGG',
    badgeClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Video,
    label: 'Video Clips',
    formats: 'MP4, WebM, MOV',
    badgeClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
];

/**
 * EditorDragOverlay
 * Visual backdrop and target overlay displayed when dragging external media assets,
 * images, or markdown files over the editor canvas.
 * Provides clear file format guidelines and local-first encryption assurances.
 */
export function EditorDragOverlay({
  isDraggingOver,
  onDragLeave,
  onDrop,
}: EditorDragOverlayProps) {
  if (!isDraggingOver) return null;

  return (
    <div
      role="region"
      aria-label="Editor File Drop Zone"
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]/85 backdrop-blur-md border-2 border-dashed border-indigo-500 rounded-2xl m-4 p-8 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150 select-none shadow-2xl"
    >
      {/* Central upload icon badge */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 shadow-inner ring-1 ring-indigo-500/30">
        <UploadCloud className="w-8 h-8 animate-bounce" />
      </div>

      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
        Drop Files to Embed in Note
      </h3>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm text-center">
        Release cursor to insert images, attachments, or markdown notes directly into your document
      </p>

      {/* Grid of supported asset categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 max-w-lg w-full">
        {SUPPORTED_ASSET_TYPES.map(({ icon: Icon, label, formats, badgeClass }) => (
          <div
            key={label}
            className={`flex flex-col items-center p-2 rounded-xl border text-center ${badgeClass}`}
          >
            <Icon className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">{label}</span>
            <span className="text-[9px] opacity-75 mt-0.5">{formats}</span>
          </div>
        ))}
      </div>

      {/* Local storage privacy badge */}
      <div className="flex items-center gap-1.5 mt-5 text-[11px] text-neutral-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        <span>Stored 100% locally in your client IndexedDB vault</span>
      </div>
    </div>
  );
}

/**
 * Validates whether a dropped file matches one of the supported media asset extensions.
 */
export function isSupportedAssetFile(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const supported = [
    'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif',
    'md', 'txt', 'pdf', 'json',
    'mp3', 'wav', 'm4a', 'ogg',
    'mp4', 'webm', 'mov',
  ];
  return supported.includes(extension);
}

