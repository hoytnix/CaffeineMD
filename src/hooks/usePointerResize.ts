'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePointerResizeOptions {
  initialSize: number;
  minSize: number;
  maxSize: number;
  direction?: 'horizontal' | 'vertical';
  onResize?: (size: number) => void;
  onResizeEnd?: (finalSize: number) => void;
}

export function usePointerResize({
  initialSize,
  minSize,
  maxSize,
  direction = 'horizontal',
  onResize,
  onResizeEnd,
}: UsePointerResizeOptions) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(initialSize);
  const latestSizeRef = useRef(initialSize);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);

  useEffect(() => {
    onResizeRef.current = onResize;
    onResizeEndRef.current = onResizeEnd;
  }, [onResize, onResizeEnd]);

  const startResize = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, customStartSize?: number) => {
      if ('preventDefault' in e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      const clientPos =
        'touches' in e && e.touches.length > 0
          ? direction === 'horizontal'
            ? e.touches[0].clientX
            : e.touches[0].clientY
          : 'clientX' in e
          ? direction === 'horizontal'
            ? e.clientX
            : e.clientY
          : 0;

      startPosRef.current = clientPos;
      const initial = customStartSize !== undefined ? customStartSize : latestSizeRef.current;
      startSizeRef.current = initial;
      latestSizeRef.current = initial;
      setIsResizing(true);
    },
    [direction]
  );

  useEffect(() => {
    if (!isResizing) return;

    const cursorStyle = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.cursor = cursorStyle;
    document.body.style.userSelect = 'none';

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientPos =
        'touches' in e && e.touches.length > 0
          ? direction === 'horizontal'
            ? e.touches[0].clientX
            : e.touches[0].clientY
          : 'clientX' in e
          ? direction === 'horizontal'
            ? (e as MouseEvent).clientX
            : (e as MouseEvent).clientY
          : 0;

      const delta = clientPos - startPosRef.current;
      const clamped = Math.min(maxSize, Math.max(minSize, startSizeRef.current + delta));
      latestSizeRef.current = clamped;
      setSize(clamped);
      onResizeRef.current?.(clamped);
    };

    const handleUp = () => {
      setIsResizing(false);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      onResizeEndRef.current?.(latestSizeRef.current);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
  }, [isResizing, direction, minSize, maxSize]);

  return {
    size,
    setSize,
    isResizing,
    startResize,
  };
}
