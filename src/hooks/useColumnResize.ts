import { useState, useCallback } from 'react';

const DEFAULT_WIDTHS: Record<string, number> = {
  title: 240,
  tags: 160,
  status: 144,
  author: 144,
  eisenhower: 180,
  updatedAt: 112,
};

export function useColumnResize() {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const startResize = useCallback(
    (colKey: string, startX: number, initialWidth?: number) => {
      const startWidth = initialWidth || columnWidths[colKey] || 140;
      setResizingCol(colKey);

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (e: MouseEvent | TouchEvent) => {
        const clientX =
          'touches' in e && e.touches.length > 0
            ? e.touches[0].clientX
            : 'clientX' in e
            ? (e as MouseEvent).clientX
            : startX;
        const delta = clientX - startX;
        const newWidth = Math.max(80, startWidth + delta);
        setColumnWidths((prev) => ({
          ...prev,
          [colKey]: newWidth,
        }));
      };

      const onMouseUp = () => {
        setResizingCol(null);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    },
    [columnWidths]
  );

  return {
    columnWidths,
    resizingCol,
    startResize,
  };
}
