import { useState, useCallback } from 'react';

export const DEFAULT_SIDEBAR_WIDTH = 256;
export const MIN_SIDEBAR_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 720;
const STORAGE_KEY = 'kite-sidebar-width';

function getInitialSidebarWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
        return parsed;
      }
    }
  } catch {
    // Storage access may fail in restricted environments
  }
  return DEFAULT_SIDEBAR_WIDTH;
}

export function useSidebarResize() {
  const [sidebarWidth, setSidebarWidthState] = useState<number>(getInitialSidebarWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const saveWidth = useCallback((width: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const setSidebarWidth = useCallback(
    (width: number | ((prev: number) => number)) => {
      setSidebarWidthState((prev) => {
        const target = typeof width === 'function' ? width(prev) : width;
        const clamped = Math.min(Math.max(MIN_SIDEBAR_WIDTH, target), MAX_SIDEBAR_WIDTH);
        saveWidth(clamped);
        return clamped;
      });
    },
    [saveWidth]
  );

  const resetWidth = useCallback(() => {
    setSidebarWidthState(DEFAULT_SIDEBAR_WIDTH);
    saveWidth(DEFAULT_SIDEBAR_WIDTH);
  }, [saveWidth]);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        const delta = moveEvent.clientX - startX;
        const maxAllowed = Math.min(
          typeof window !== 'undefined' ? window.innerWidth * 0.75 : MAX_SIDEBAR_WIDTH,
          MAX_SIDEBAR_WIDTH
        );
        const newWidth = Math.min(Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta), maxAllowed);
        setSidebarWidthState(newWidth);
        saveWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [sidebarWidth, saveWidth]
  );

  return {
    sidebarWidth,
    isResizing,
    startResize,
    resetWidth,
    setSidebarWidth,
  };
}
