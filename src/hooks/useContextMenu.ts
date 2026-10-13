'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useContextMenu<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetData, setTargetData] = useState<T | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(
    (e: React.MouseEvent | { clientX: number; clientY: number; preventDefault?: () => void }, data?: T) => {
      if ('preventDefault' in e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if ('stopPropagation' in e && typeof (e as any).stopPropagation === 'function') {
        (e as any).stopPropagation();
      }

      setPosition({ x: e.clientX, y: e.clientY });
      setTargetData(data ?? null);
      setIsOpen(true);
    },
    []
  );

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Long-press binder for touch/mobile devices (500ms threshold)
  const bindLongPress = useCallback(
    (data?: T) => ({
      onTouchStart: (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const clientX = touch.clientX;
        const clientY = touch.clientY;

        longPressTimerRef.current = setTimeout(() => {
          openMenu({ clientX, clientY }, data);
        }, 500);
      },
      onTouchEnd: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      },
      onTouchMove: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      },
    }),
    [openMenu]
  );

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    position,
    targetData,
    openMenu,
    closeMenu,
    bindLongPress,
  };
}
