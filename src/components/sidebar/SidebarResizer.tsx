'use client';

import React, { useCallback } from 'react';
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, DEFAULT_SIDEBAR_WIDTH } from './hooks/useSidebarResize';

export interface SidebarResizerProps {
  onStartResize: (e: React.MouseEvent) => void;
  onReset: () => void;
  currentWidth: number;
  onKeyDownResize: (updater: (prev: number) => number) => void;
  isResizing: boolean;
}

export function SidebarResizer({
  onStartResize,
  onReset,
  currentWidth,
  onKeyDownResize,
  isResizing,
}: SidebarResizerProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onKeyDownResize((w) => w - 16);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onKeyDownResize((w) => w + 16);
      } else if (e.key === 'Home') {
        e.preventDefault();
        onKeyDownResize(() => MIN_SIDEBAR_WIDTH);
      } else if (e.key === 'End') {
        e.preventDefault();
        onKeyDownResize(() => MAX_SIDEBAR_WIDTH);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onReset();
      }
    },
    [onKeyDownResize, onReset]
  );

  return (
    <>
      {/* Draggable border split bar */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(currentWidth)}
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-label="Resize file explorer sidebar (Use Left/Right arrow keys or drag; double click to reset)"
        tabIndex={0}
        onMouseDown={onStartResize}
        onDoubleClick={onReset}
        onKeyDown={handleKeyDown}
        className={`absolute top-0 -right-1 w-2.5 h-full cursor-col-resize z-20 group flex items-center justify-center select-none transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/70 ${
          isResizing ? 'bg-indigo-500/20' : 'hover:bg-indigo-500/10'
        }`}
        title={`Drag to resize sidebar (${Math.round(currentWidth)}px) • Double-click to reset (${DEFAULT_SIDEBAR_WIDTH}px)`}
      >
        {/* Subtle accent highlight line */}
        <div
          className={`w-[2px] h-full transition-colors ${
            isResizing
              ? 'bg-indigo-500 shadow-xs shadow-indigo-500/50'
              : 'bg-transparent group-hover:bg-indigo-400/80 group-focus:bg-indigo-500'
          }`}
        />
      </div>

      {/* Full-screen capture overlay during drag to prevent iframe / editor selection glitching */}
      {isResizing && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize select-none"
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}
