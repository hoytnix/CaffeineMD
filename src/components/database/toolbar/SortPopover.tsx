'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortPopoverProps {
  sortBy?: string;
  onSortByChange?: (sort: string) => void;
}

export function SortPopover({ sortBy = 'updatedAt', onSortByChange }: SortPopoverProps) {
  if (!onSortByChange) return null;

  return (
    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
      <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
      >
        <option value="updatedAt">Sort: Updated</option>
        <option value="createdAt">Sort: Created</option>
        <option value="title">Sort: Title</option>
        <option value="status">Sort: Status</option>
        <option value="author">Sort: Author</option>
        <option value="eisenhower">Sort: Priority</option>
      </select>
    </div>
  );
}
