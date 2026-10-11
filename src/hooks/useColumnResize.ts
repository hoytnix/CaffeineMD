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

      const onMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        const newWidth = Math.max(80, startWidth + delta);
        setColumnWidths((prev) => ({
          ...prev,
          [colKey]: newWidth,
        }));
      };

      const onMouseUp = () => {
        setResizingCol(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [columnWidths]
  );

  return {
    columnWidths,
    resizingCol,
    startResize,
  };
}
