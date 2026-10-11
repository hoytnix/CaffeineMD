'use client';

import React from 'react';
import { VaultFile, db, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { FileText } from 'lucide-react';

export const STATUS_OPTIONS = ['Draft', 'In Progress', 'Completed', 'Archived'] as const;

interface TableCellRendererProps {
  file: VaultFile;
  colKey: string;
  isEditing: boolean;
  cellValue: string;
  onValueChange: (val: string) => void;
  onCellClick: () => void;
  onCellSave: () => void;
  onOpenFile: () => void;
  onRefresh: () => void;
}

export function TableCellRenderer({
  file,
  colKey,
  isEditing,
  cellValue,
  onValueChange,
  onCellClick,
  onCellSave,
  onOpenFile,
  onRefresh,
}: TableCellRendererProps) {
  const currentStatus = file.frontmatter?.status || DEFAULT_NOTE_PROPERTIES.status;
  const currentEisenhower = normalizeEisenhower(file.eisenhower || file.frontmatter?.eisenhower);
  const eqConfig = EISENHOWER_CONFIG[currentEisenhower];

  // 1. Title
  if (colKey === 'title') {
    return (
      <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 font-medium">
        <div
          onClick={onOpenFile}
          className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
        >
          {eqConfig && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${eqConfig.dotBg}`}
              title={`Eisenhower: ${eqConfig.label}`}
            />
          )}
          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate">{file.title || file.name}</span>
        </div>
      </td>
    );
  }

  // 2. Tags
  if (colKey === 'tags') {
    return (
      <td
        onClick={onCellClick}
        className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-600 dark:text-neutral-300"
      >
        {isEditing ? (
          <input
            type="text"
            value={cellValue}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={onCellSave}
            onKeyDown={(e) => e.key === 'Enter' && onCellSave()}
            autoFocus
            className="w-full px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded outline-none border border-indigo-500"
          />
        ) : file.tags && file.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-[11px] text-neutral-600 dark:text-neutral-300">
            {file.tags.map((t, idx) => (
              <span key={t}>
                #{t}{idx < file.tags.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-neutral-400 opacity-60">Empty</span>
        )}
      </td>
    );
  }

  // 3. Status
  if (colKey === 'status') {
    return (
      <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
        <select
          value={currentStatus}
          onChange={async (e) => {
            const newStatus = e.target.value;
            await db.files.put({
              ...file,
              frontmatter: { ...file.frontmatter, status: newStatus },
              updatedAt: Date.now(),
            });
            onRefresh();
          }}
          className="w-full px-1.5 py-0.5 rounded text-[11px] bg-transparent border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-indigo-500 outline-none cursor-pointer"
        >
          {!STATUS_OPTIONS.includes(currentStatus as any) && (
            <option value={currentStatus}>{currentStatus}</option>
          )}
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </td>
    );
  }

  // 4. Author
  if (colKey === 'author') {
    return (
      <td
        onClick={onCellClick}
        className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
      >
        {isEditing ? (
          <input
            type="text"
            value={cellValue}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={onCellSave}
            onKeyDown={(e) => e.key === 'Enter' && onCellSave()}
            autoFocus
            className="w-full px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded outline-none border border-indigo-500"
          />
        ) : file.frontmatter?.author ? (
          <span className="truncate block text-[11px]">{file.frontmatter.author}</span>
        ) : (
          <span className="text-neutral-400 opacity-40">—</span>
        )}
      </td>
    );
  }

  // 5. Eisenhower
  if (colKey === 'eisenhower') {
    return (
      <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
        <select
          value={currentEisenhower}
          onChange={async (e) => {
            const val = e.target.value as any;
            await db.files.put({
              ...file,
              eisenhower: val,
              frontmatter: { ...file.frontmatter, eisenhower: val },
              updatedAt: Date.now(),
            });
            onRefresh();
          }}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer outline-none ${
            eqConfig
              ? eqConfig.badgeClass
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
          }`}
          title={eqConfig ? eqConfig.label : 'Assign Eisenhower priority'}
        >
          <option value="Urgent & Immediate">🔴 Do First</option>
          <option value="Urgent & Not Immediate">🟡 Schedule</option>
          <option value="Not Urgent & Immediate">🔵 Delegate</option>
          <option value="Not Urgent & Not Immediate">⚪ Backlog</option>
        </select>
      </td>
    );
  }

  // 6. UpdatedAt
  if (colKey === 'updatedAt') {
    return (
      <td className="py-2 px-3 text-neutral-400 text-[11px] font-mono tabular-nums whitespace-nowrap">
        {new Date(file.updatedAt).toLocaleDateString()}
      </td>
    );
  }

  // 7. Custom column fallback
  const val = file.frontmatter?.[colKey];
  return (
    <td
      onClick={onCellClick}
      className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
    >
      {isEditing ? (
        <input
          type="text"
          value={cellValue}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onCellSave}
          onKeyDown={(e) => e.key === 'Enter' && onCellSave()}
          autoFocus
          className="w-full px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded outline-none border border-indigo-500"
        />
      ) : val !== undefined && val !== null ? (
        <span className="truncate block font-mono text-[11px]">{String(val)}</span>
      ) : (
        <span className="text-neutral-400 opacity-40">—</span>
      )}
    </td>
  );
}
