'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useFloatingDismiss<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
  anchorPos?: { x: number; y: number } | null,
  padding = 8
) {
  const ref = useRef<T | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !anchorPos || !ref.current || typeof window === 'undefined') return;
    const rect = ref.current.getBoundingClientRect();
    const left = Math.min(anchorPos.x, window.innerWidth - rect.width - padding);
    const top = Math.min(anchorPos.y, window.innerHeight - rect.height - padding);
    setCoords({ top: Math.max(padding, top), left: Math.max(padding, left) });
  }, [isOpen, anchorPos, padding]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onPointerDown, true);
    window.addEventListener('touchstart', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown, true);
      window.removeEventListener('touchstart', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [isOpen, onClose]);

  return { ref, coords };
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
