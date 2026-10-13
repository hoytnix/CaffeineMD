'use client';

import React, { useState, useMemo } from 'react';
import { VaultFile, db } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useColumnResize } from '@/src/hooks/useColumnResize';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { TablePaginationBar } from './table/TablePaginationBar';

interface TableViewProps {
  files: VaultFile[];
  columns: string[];
  onRefresh: () => void;
}

export function TableView({ files, columns, onRefresh }: TableViewProps) {
  const { openFileTab } = useWorkspaceStore();
  const [editingCell, setEditingCell] = useState<{ path: string; key: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [sortCol, setSortCol] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { columnWidths, resizingCol, startResize } = useColumnResize();

  const customColumns = useMemo(() => {
    return columns.filter(
      (c) => !['title', 'tags', 'status', 'author', 'eisenhower'].includes(c)
    );
  }, [columns]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortOrder('asc');
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      let comparison = 0;
      if (sortCol === 'title' || sortCol === 'name') {
        comparison = (a.title || a.name).localeCompare(b.title || b.name);
      } else if (sortCol === 'tags') {
        comparison = (a.tags || []).join(', ').localeCompare((b.tags || []).join(', '));
      } else if (sortCol === 'status') {
        comparison = String(a.frontmatter?.status || 'Draft').localeCompare(String(b.frontmatter?.status || 'Draft'));
      } else if (sortCol === 'author') {
        comparison = String(a.frontmatter?.author || '').localeCompare(String(b.frontmatter?.author || ''));
      } else if (sortCol === 'eisenhower') {
        comparison = normalizeEisenhower(a.eisenhower || a.frontmatter?.eisenhower).localeCompare(
          normalizeEisenhower(b.eisenhower || b.frontmatter?.eisenhower)
        );
      } else if (sortCol === 'updatedAt') {
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0);
      } else {
        comparison = String(a.frontmatter?.[sortCol] ?? '').localeCompare(String(b.frontmatter?.[sortCol] ?? ''));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, sortCol, sortOrder]);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFiles.slice(start, start + pageSize);
  }, [sortedFiles, currentPage, pageSize]);

  const handleCellClick = (file: VaultFile, key: string) => {
    setEditingCell({ path: file.path, key });
    if (key === 'title') {
      setCellValue(file.title || file.name);
    } else if (key === 'tags') {
      setCellValue(file.tags ? file.tags.join(', ') : '');
    } else if (key === 'author') {
      setCellValue(file.frontmatter?.author || '');
    } else {
      setCellValue(file.frontmatter?.[key] !== undefined ? String(file.frontmatter[key]) : '');
    }
  };

  const handleCellSave = async (file: VaultFile, key: string) => {
    if (key === 'title') {
      await db.files.put({
        ...file,
        title: cellValue,
        frontmatter: { ...file.frontmatter, title: cellValue },
        updatedAt: Date.now(),
      });
    } else if (key === 'tags') {
      const newTags = cellValue.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      await db.files.put({
        ...file,
        tags: newTags,
        frontmatter: { ...file.frontmatter, tags: newTags },
        updatedAt: Date.now(),
      });
    } else if (key === 'author') {
      await db.files.put({
        ...file,
        frontmatter: { ...file.frontmatter, author: cellValue.trim() },
        updatedAt: Date.now(),
      });
    } else {
      await db.files.put({
        ...file,
        frontmatter: { ...file.frontmatter, [key]: cellValue },
        updatedAt: Date.now(),
      });
    }

    setEditingCell(null);
    onRefresh();
  };

  return (
    <div
      style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
      className="w-full flex flex-col border rounded-lg shadow-xs overflow-hidden"
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <TableHeader
            sortCol={sortCol}
            sortOrder={sortOrder}
            onSort={handleSort}
            customColumns={customColumns}
            columnWidths={columnWidths}
            resizingCol={resizingCol}
            onStartResize={startResize}
          />
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {paginatedFiles.map((file) => (
              <TableRow
                key={file.path}
                file={file}
                customColumns={customColumns}
                editingCell={editingCell}
                cellValue={cellValue}
                onCellValueChange={setCellValue}
                onCellClick={handleCellClick}
                onCellSave={handleCellSave}
                onOpenFile={(path, title) => openFileTab(path, title)}
                onRefresh={onRefresh}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TablePaginationBar
        totalCount={sortedFiles.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
