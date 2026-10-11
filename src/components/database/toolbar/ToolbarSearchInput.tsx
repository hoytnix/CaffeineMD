'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface ToolbarSearchInputProps {
  searchFilter: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function ToolbarSearchInput({
  searchFilter,
  onSearchChange,
  placeholder = 'Filter records...',
}: ToolbarSearchInputProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 bg-neutral-50/50 dark:bg-neutral-950">
      <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchFilter}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-transparent border-none outline-none w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
      />
      {searchFilter && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
