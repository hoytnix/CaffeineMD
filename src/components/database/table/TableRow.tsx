'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { TableCellFactory } from './TableCellFactory';

interface TableRowProps {
  file: VaultFile;
  customColumns: string[];
  editingCell: { path: string; key: string } | null;
  cellValue: string;
  onCellValueChange: (val: string) => void;
  onCellClick: (file: VaultFile, key: string) => void;
  onCellSave: (file: VaultFile, key: string) => void;
  onOpenFile: (path: string, title?: string) => void;
  onRefresh: () => void;
}

export function TableRow({
  file,
  customColumns,
  editingCell,
  cellValue,
  onCellValueChange,
  onCellClick,
  onCellSave,
  onOpenFile,
  onRefresh,
}: TableRowProps) {
  const isCellEditing = (key: string) =>
    editingCell?.path === file.path && editingCell.key === key;

  return (
    <tr className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
      <TableCellFactory
        file={file}
        colKey="title"
        isEditing={false}
        cellValue=""
        onValueChange={onCellValueChange}
        onCellClick={() => {}}
        onCellSave={() => {}}
        onOpenFile={() => onOpenFile(file.path, file.title)}
        onRefresh={onRefresh}
      />

      <TableCellFactory
        file={file}
        colKey="tags"
        isEditing={isCellEditing('tags')}
        cellValue={cellValue}
        onValueChange={onCellValueChange}
        onCellClick={() => onCellClick(file, 'tags')}
        onCellSave={() => onCellSave(file, 'tags')}
        onOpenFile={() => {}}
        onRefresh={onRefresh}
      />

      <TableCellFactory
        file={file}
        colKey="status"
        isEditing={false}
        cellValue=""
        onValueChange={onCellValueChange}
        onCellClick={() => {}}
        onCellSave={() => {}}
        onOpenFile={() => {}}
        onRefresh={onRefresh}
      />

      <TableCellFactory
        file={file}
        colKey="author"
        isEditing={isCellEditing('author')}
        cellValue={cellValue}
        onValueChange={onCellValueChange}
        onCellClick={() => onCellClick(file, 'author')}
        onCellSave={() => onCellSave(file, 'author')}
        onOpenFile={() => {}}
        onRefresh={onRefresh}
      />

      <TableCellFactory
        file={file}
        colKey="eisenhower"
        isEditing={false}
        cellValue=""
        onValueChange={onCellValueChange}
        onCellClick={() => {}}
        onCellSave={() => {}}
        onOpenFile={() => {}}
        onRefresh={onRefresh}
      />

      {customColumns.map((col) => (
        <TableCellFactory
          key={col}
          file={file}
          colKey={col}
          isEditing={isCellEditing(col)}
          cellValue={cellValue}
          onValueChange={onCellValueChange}
          onCellClick={() => onCellClick(file, col)}
          onCellSave={() => onCellSave(file, col)}
          onOpenFile={() => {}}
          onRefresh={onRefresh}
        />
      ))}

      <TableCellFactory
        file={file}
        colKey="updatedAt"
        isEditing={false}
        cellValue=""
        onValueChange={onCellValueChange}
        onCellClick={() => {}}
        onCellSave={() => {}}
        onOpenFile={() => {}}
        onRefresh={onRefresh}
      />
    </tr>
  );
}
