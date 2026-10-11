'use client';

import React from 'react';

export interface TableColumnResizerProps {
  columnKey: string;
  currentWidth: number;
  isResizing?: boolean;
  minWidth?: number;
  maxWidth?: number;
  onStartResize: (colKey: string, startX: number, initialWidth?: number) => void;
}

/**
 * TableColumnResizer
 * Interactive handle placed on the right border of table column headers.
 * Provides visual resize guides, cursor changes, accessibility controls,
 * and handles mouse down drag boundary initiation.
 */
export function TableColumnResizer({
  columnKey,
  currentWidth,
  isResizing = false,
  minWidth = 80,
  maxWidth = 800,
  onStartResize,
}: TableColumnResizerProps) {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onStartResize(columnKey, e.clientX, currentWidth);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Reset to default column width preset on double click
    const defaultResetWidth =
      columnKey === 'title'
        ? 240
        : columnKey === 'eisenhower'
        ? 180
        : columnKey === 'tags'
        ? 160
        : columnKey === 'updatedAt'
        ? 112
        : 144;
    onStartResize(columnKey, e.clientX, defaultResetWidth);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newWidth = Math.min(maxWidth, currentWidth + 10);
      onStartResize(columnKey, 0, newWidth);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newWidth = Math.max(minWidth, currentWidth - 10);
      onStartResize(columnKey, 0, newWidth);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onStartResize(columnKey, 0, minWidth);
    } else if (e.key === 'End') {
      e.preventDefault();
      onStartResize(columnKey, 0, maxWidth);
    }
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-label={`Resize ${columnKey} column. Use arrow keys to adjust, or double click to reset.`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={`absolute right-0 top-0 bottom-0 w-2 select-none z-10 cursor-col-resize group/resizer flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
        isResizing ? 'bg-indigo-500' : 'hover:bg-indigo-500/30'
      }`}
    >
      {/* Subtle visual resize guide line */}
      <div
        className={`w-[2px] h-full transition-opacity ${
          isResizing
            ? 'bg-indigo-500 opacity-100'
            : 'bg-neutral-300 dark:bg-neutral-700 opacity-0 group-hover/resizer:opacity-100'
        }`}
      />

      {/* Floating tooltip indicating current pixel width while dragging */}
      {isResizing && (
        <div
          role="tooltip"
          aria-live="polite"
          className="absolute -top-7 right-1/2 translate-x-1/2 px-1.5 py-0.5 rounded bg-neutral-900 text-white font-mono text-[9px] pointer-events-none shadow-md z-30 whitespace-nowrap animate-in fade-in"
        >
          {Math.round(currentWidth)}px
        </div>
      )}
    </div>
  );
}
