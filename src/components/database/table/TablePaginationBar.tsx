'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface TablePaginationBarProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * TablePaginationBar
 * Modular pagination controller for TableView.
 * Provides row counters, page navigation arrows, and page size picker.
 */
export function TablePaginationBar({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRow = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(totalCount, currentPage * pageSize);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-500 select-none">
      {/* Row count summary */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-neutral-800 dark:text-neutral-200">{startRow}</strong> to{' '}
          <strong className="text-neutral-800 dark:text-neutral-200">{endRow}</strong> of{' '}
          <strong className="text-neutral-800 dark:text-neutral-200">{totalCount}</strong> rows
        </span>
      </div>

      {/* Page Controls & Size Selector */}
      <div className="flex items-center gap-4">
        {/* Page size dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="table-page-size" className="text-[11px] text-neutral-400">
            Per page:
          </label>
          <select
            id="table-page-size"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(1)}
            title="First page"
            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-neutral-600 dark:text-neutral-400"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous page"
            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-neutral-600 dark:text-neutral-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono text-[11px]">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next page"
            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-neutral-600 dark:text-neutral-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-neutral-600 dark:text-neutral-400"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
