'use client';

import React from 'react';
import { Folder, Tag, Layers, Flag } from 'lucide-react';

interface FilterPopoverProps {
  filterFolder: string;
  onFolderChange: (folder: string) => void;
  folders: string[];
  filterTag: string;
  onTagChange: (tag: string) => void;
  tags: string[];
  filterStatus?: string;
  onStatusChange?: (status: string) => void;
  statuses?: string[];
  filterEisenhower?: string;
  onEisenhowerChange?: (eisenhower: string) => void;
}

const EISENHOWER_FILTER_OPTIONS = [
  'Urgent & Immediate',
  'Urgent & Not Immediate',
  'Not Urgent & Immediate',
  'Not Urgent & Not Immediate',
];

export function FilterPopover({
  filterFolder,
  onFolderChange,
  folders,
  filterTag,
  onTagChange,
  tags,
  filterStatus = 'all',
  onStatusChange,
  statuses = ['Draft', 'In Progress', 'Completed', 'Archived'],
  filterEisenhower = 'all',
  onEisenhowerChange,
}: FilterPopoverProps) {
  return (
    <>
      {/* Folder filter */}
      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
        <Folder className="w-3.5 h-3.5 text-neutral-400" />
        <select
          value={filterFolder}
          onChange={(e) => onFolderChange(e.target.value)}
          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
        >
          <option value="all">All Folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Tag filter */}
      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
        <Tag className="w-3.5 h-3.5 text-neutral-400" />
        <select
          value={filterTag}
          onChange={(e) => onTagChange(e.target.value)}
          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
        >
          <option value="all">All Tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      {onStatusChange && (
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Eisenhower filter */}
      {onEisenhowerChange && (
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <Flag className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={filterEisenhower}
            onChange={(e) => onEisenhowerChange(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            {EISENHOWER_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
