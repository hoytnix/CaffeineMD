'use client';

import React, { useState, useMemo } from 'react';
import { VaultFile, db, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TableViewProps {
  files: VaultFile[];
  columns: string[];
  onRefresh: () => void;
}

const STATUS_OPTIONS = ['Draft', 'In Progress', 'Completed', 'Archived'] as const;

export function TableView({ files, columns, onRefresh }: TableViewProps) {
  const { openFileTab } = useWorkspaceStore();
  const [editingCell, setEditingCell] = useState<{ path: string; key: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [sortCol, setSortCol] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter out the 5 default properties from dynamic columns
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
        const ta = (a.tags || []).join(', ');
        const tb = (b.tags || []).join(', ');
        comparison = ta.localeCompare(tb);
      } else if (sortCol === 'status') {
        const sa = String(a.frontmatter?.status || 'Draft');
        const sb = String(b.frontmatter?.status || 'Draft');
        comparison = sa.localeCompare(sb);
      } else if (sortCol === 'author') {
        const aa = String(a.frontmatter?.author || '');
        const ab = String(b.frontmatter?.author || '');
        comparison = aa.localeCompare(ab);
      } else if (sortCol === 'eisenhower') {
        const ea = normalizeEisenhower(a.eisenhower || a.frontmatter?.eisenhower);
        const eb = normalizeEisenhower(b.eisenhower || b.frontmatter?.eisenhower);
        comparison = ea.localeCompare(eb);
      } else if (sortCol === 'updatedAt') {
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0);
      } else {
        const va = String(a.frontmatter?.[sortCol] ?? '');
        const vb = String(b.frontmatter?.[sortCol] ?? '');
        comparison = va.localeCompare(vb);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, sortCol, sortOrder]);

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
      const updated = {
        ...file,
        title: cellValue,
        frontmatter: { ...file.frontmatter, title: cellValue },
        updatedAt: Date.now(),
      };
      await db.files.put(updated);
    } else if (key === 'tags') {
      const newTags = cellValue.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      const updated = {
        ...file,
        tags: newTags,
        frontmatter: { ...file.frontmatter, tags: newTags },
        updatedAt: Date.now(),
      };
      await db.files.put(updated);
    } else if (key === 'author') {
      const updated = {
        ...file,
        frontmatter: { ...file.frontmatter, author: cellValue.trim() },
        updatedAt: Date.now(),
      };
      await db.files.put(updated);
    } else {
      const updated = {
        ...file,
        frontmatter: { ...file.frontmatter, [key]: cellValue },
        updatedAt: Date.now(),
      };
      await db.files.put(updated);
    }

    setEditingCell(null);
    onRefresh();
  };

  const renderSortIcon = (colKey: string) => {
    if (sortCol !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-0 group-hover/th:opacity-100 transition-opacity ml-auto" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-500 ml-auto" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-500 ml-auto" />
    );
  };

  return (
    <div className="w-full overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium select-none">
            {/* Title / Name */}
            <th
              onClick={() => handleSort('title')}
              className="py-2.5 px-3 w-60 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Title</span>
                {renderSortIcon('title')}
              </div>
            </th>

            {/* Tags */}
            <th
              onClick={() => handleSort('tags')}
              className="py-2.5 px-3 w-40 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Tags</span>
                {renderSortIcon('tags')}
              </div>
            </th>

            {/* Status */}
            <th
              onClick={() => handleSort('status')}
              className="py-2.5 px-3 w-36 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Status</span>
                {renderSortIcon('status')}
              </div>
            </th>

            {/* Author */}
            <th
              onClick={() => handleSort('author')}
              className="py-2.5 px-3 w-36 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Author</span>
                {renderSortIcon('author')}
              </div>
            </th>

            {/* Eisenhower */}
            <th
              onClick={() => handleSort('eisenhower')}
              className="py-2.5 px-3 w-48 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Eisenhower</span>
                {renderSortIcon('eisenhower')}
              </div>
            </th>

            {/* Custom columns */}
            {customColumns.map((col) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="py-2.5 px-3 w-36 border-r border-neutral-200 dark:border-neutral-800 capitalize cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
              >
                <div className="flex items-center justify-between">
                  <span>{col}</span>
                  {renderSortIcon(col)}
                </div>
              </th>
            ))}

            {/* Updated At */}
            <th
              onClick={() => handleSort('updatedAt')}
              className="py-2.5 px-3 w-28 text-neutral-400 cursor-pointer group/th hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center justify-between">
                <span>Updated</span>
                {renderSortIcon('updatedAt')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {sortedFiles.map((file) => {
            const currentStatus = file.frontmatter?.status || DEFAULT_NOTE_PROPERTIES.status;
            const currentEisenhower = normalizeEisenhower(file.eisenhower || file.frontmatter?.eisenhower);
            const opt = EISENHOWER_CONFIG[currentEisenhower];

            return (
              <tr
                key={file.path}
                className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
              >
                {/* 1. Title / Name */}
                <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 font-medium">
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => openFileTab(file.path, file.title)}
                      className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                    >
                      {opt && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${opt.dotBg}`}
                          title={`Eisenhower: ${opt.label}`}
                        />
                      )}
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{file.title || file.name}</span>
                    </div>
                  </div>
                </td>

                {/* 2. Tags */}
                <td
                  onClick={() => handleCellClick(file, 'tags')}
                  className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-600 dark:text-neutral-300"
                >
                  {editingCell?.path === file.path && editingCell.key === 'tags' ? (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={(e) => setCellValue(e.target.value)}
                      onBlur={() => handleCellSave(file, 'tags')}
                      onKeyDown={(e) => e.key === 'Enter' && handleCellSave(file, 'tags')}
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

                {/* 3. Status */}
                <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <select
                    value={currentStatus}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      const updated = {
                        ...file,
                        frontmatter: { ...file.frontmatter, status: newStatus },
                        updatedAt: Date.now(),
                      };
                      await db.files.put(updated);
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

                {/* 4. Author */}
                <td
                  onClick={() => handleCellClick(file, 'author')}
                  className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
                >
                  {editingCell?.path === file.path && editingCell.key === 'author' ? (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={(e) => setCellValue(e.target.value)}
                      onBlur={() => handleCellSave(file, 'author')}
                      onKeyDown={(e) => e.key === 'Enter' && handleCellSave(file, 'author')}
                      autoFocus
                      className="w-full px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded outline-none border border-indigo-500"
                    />
                  ) : file.frontmatter?.author ? (
                    <span className="truncate block text-[11px]">{file.frontmatter.author}</span>
                  ) : (
                    <span className="text-neutral-400 opacity-40">—</span>
                  )}
                </td>

                {/* 5. Eisenhower Column */}
                <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={currentEisenhower}
                      onChange={async (e) => {
                        const val = e.target.value as any;
                        const updated = {
                          ...file,
                          eisenhower: val,
                          frontmatter: {
                            ...file.frontmatter,
                            eisenhower: val,
                          },
                          updatedAt: Date.now(),
                        };
                        await db.files.put(updated);
                        onRefresh();
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer outline-none ${
                        opt ? opt.badgeClass : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                      }`}
                      title={opt ? opt.label : 'Assign Eisenhower priority'}
                    >
                      <option value="Urgent & Immediate">🔴 Do First</option>
                      <option value="Urgent & Not Immediate">🟡 Schedule</option>
                      <option value="Not Urgent & Immediate">🔵 Delegate</option>
                      <option value="Not Urgent & Not Immediate">⚪ Backlog</option>
                    </select>
                  </div>
                </td>

                {/* Custom Columns */}
                {customColumns.map((col) => {
                  const val = file.frontmatter?.[col];
                  const isEditing = editingCell?.path === file.path && editingCell.key === col;

                  return (
                    <td
                      key={col}
                      onClick={() => handleCellClick(file, col)}
                      className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCellSave(file, col)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCellSave(file, col)}
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
                })}

                {/* Updated At */}
                <td className="py-2 px-3 text-neutral-400 text-[11px] font-mono tabular-nums whitespace-nowrap">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
