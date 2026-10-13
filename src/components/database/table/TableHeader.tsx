'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableColumnResizer } from './TableColumnResizer';

interface TableHeaderProps {
  sortCol: string;
  sortOrder: 'asc' | 'desc';
  onSort: (colKey: string) => void;
  customColumns: string[];
  columnWidths?: Record<string, number>;
  resizingCol?: string | null;
  onStartResize?: (colKey: string, startX: number, initialWidth?: number) => void;
}

export function TableHeader({
  sortCol,
  sortOrder,
  onSort,
  customColumns,
  columnWidths,
  resizingCol,
  onStartResize,
}: TableHeaderProps) {
  const renderSortIcon = (colKey: string) => {
    if (sortCol !== colKey) {
      return (
        <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-0 group-hover/th:opacity-100 transition-opacity ml-auto" />
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-500 ml-auto" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-500 ml-auto" />
    );
  };

  const renderTh = (key: string, label: string, defaultWidth: number) => {
    const width = columnWidths?.[key] || defaultWidth;
    return (
      <th
        key={key}
        style={{
          width: `${width}px`,
          minWidth: `${width}px`,
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-secondary)',
        }}
        onClick={() => onSort(key)}
        className="py-2.5 px-3 border-r cursor-pointer group/th hover:bg-[var(--theme-bg-card)] relative select-none"
      >
        <div className="flex items-center justify-between">
          <span className="capitalize">{label}</span>
          {renderSortIcon(key)}
        </div>
        {onStartResize && (
          <TableColumnResizer
            columnKey={key}
            currentWidth={width}
            isResizing={resizingCol === key}
            onStartResize={onStartResize}
          />
        )}
      </th>
    );
  };

  return (
    <thead>
      <tr
        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
        className="border-b font-medium select-none text-xs"
      >
        {renderTh('title', 'Title', 240)}
        {renderTh('tags', 'Tags', 160)}
        {renderTh('status', 'Status', 144)}
        {renderTh('author', 'Author', 144)}
        {renderTh('eisenhower', 'Eisenhower', 180)}
        {customColumns.map((col) => renderTh(col, col, 144))}
        {renderTh('updatedAt', 'Updated', 112)}
      </tr>
    </thead>
  );
}
