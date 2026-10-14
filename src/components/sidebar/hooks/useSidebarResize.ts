import { useCallback } from 'react';
import { usePointerResize } from '@/src/hooks/usePointerResize';
import { storageRegistry, STORAGE_KEYS } from '@/src/lib/config/storageRegistry';

export const DEFAULT_SIDEBAR_WIDTH = 256;
export const MIN_SIDEBAR_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 720;

function getInitialSidebarWidth(): number {
  const saved = storageRegistry.getItem(STORAGE_KEYS.SIDEBAR_WIDTH);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
      return parsed;
    }
  }
  return DEFAULT_SIDEBAR_WIDTH;
}

export function useSidebarResize() {
  const saveWidth = useCallback((width: number) => {
    storageRegistry.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, String(Math.round(width)));
  }, []);

  const {
    size: sidebarWidth,
    setSize: setSidebarWidthState,
    isResizing,
    startResize: baseStartResize,
  } = usePointerResize({
    initialSize: getInitialSidebarWidth(),
    minSize: MIN_SIDEBAR_WIDTH,
    maxSize: MAX_SIDEBAR_WIDTH,
    direction: 'horizontal',
    onResize: (newWidth) => saveWidth(newWidth),
    onResizeEnd: (finalWidth) => saveWidth(finalWidth),
  });

  const setSidebarWidth = useCallback(
    (width: number | ((prev: number) => number)) => {
      setSidebarWidthState((prev) => {
        const target = typeof width === 'function' ? width(prev) : width;
        const clamped = Math.min(Math.max(MIN_SIDEBAR_WIDTH, target), MAX_SIDEBAR_WIDTH);
        saveWidth(clamped);
        return clamped;
      });
    },
    [setSidebarWidthState, saveWidth]
  );

  const resetWidth = useCallback(() => {
    setSidebarWidthState(DEFAULT_SIDEBAR_WIDTH);
    saveWidth(DEFAULT_SIDEBAR_WIDTH);
  }, [setSidebarWidthState, saveWidth]);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      baseStartResize(e, sidebarWidth);
    },
    [baseStartResize, sidebarWidth]
  );

  return {
    sidebarWidth,
    isResizing,
    startResize,
    resetWidth,
    setSidebarWidth,
  };
}
