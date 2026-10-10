'use client';

import React, { useState } from 'react';
import { VaultFile, db, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { FileText, Plus, ChevronDown, Check } from 'lucide-react';

interface TableViewProps {
  files: VaultFile[];
  columns: string[];
  onRefresh: () => void;
}

export function TableView({ files, columns, onRefresh }: TableViewProps) {
  const { openFileTab } = useWorkspaceStore();
  const [editingCell, setEditingCell] = useState<{ path: string; key: string } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const handleCellClick = (file: VaultFile, key: string) => {
    setEditingCell({ path: file.path, key });
    if (key === 'title') {
      setCellValue(file.title || file.name);
    } else if (key === 'tags') {
      setCellValue(file.tags ? file.tags.join(', ') : '');
    } else {
      setCellValue(file.frontmatter?.[key] !== undefined ? String(file.frontmatter[key]) : '');
    }
  };

  const handleCellSave = async (file: VaultFile, key: string) => {
    if (key === 'title') {
      const updated = { ...file, title: cellValue, updatedAt: Date.now() };
      await db.files.put(updated);
    } else if (key === 'tags') {
      const newTags = cellValue.split(',').map((t) => t.trim()).filter(Boolean);
      const updated = {
        ...file,
        tags: newTags,
        frontmatter: { ...file.frontmatter, tags: newTags },
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

  return (
    <div className="w-full overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium">
            <th className="py-2.5 px-3 w-64 border-r border-neutral-200 dark:border-neutral-800">
              Name
            </th>
            <th className="py-2.5 px-3 w-40 border-r border-neutral-200 dark:border-neutral-800">
              Tags
            </th>
            <th className="py-2.5 px-3 w-36 border-r border-neutral-200 dark:border-neutral-800">
              Eisenhower
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="py-2.5 px-3 w-36 border-r border-neutral-200 dark:border-neutral-800 capitalize"
              >
                {col}
              </th>
            ))}
            <th className="py-2.5 px-3 w-28 text-neutral-400">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {files.map((file) => (
            <tr
              key={file.path}
              className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
            >
              {/* Title / Name */}
              <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 font-medium">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => openFileTab(file.path, file.title)}
                    className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                  >
                    {(() => {
                      const rawQuadrant = (file.eisenhower || file.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
                      const opt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;
                      return opt ? (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${opt.dotBg}`}
                          title={`Eisenhower: ${opt.label}`}
                        />
                      ) : null;
                    })()}
                    <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{file.title || file.name}</span>
                  </div>
                </div>
              </td>

              {/* Tags */}
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
                        {t}{idx < file.tags.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-400 opacity-60">Empty</span>
                )}
              </td>

              {/* Eisenhower Column */}
              <td className="py-2 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                {(() => {
                  const rawQuadrant = (file.eisenhower || file.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
                  const opt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;
                  return (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={rawQuadrant || ''}
                        onChange={async (e) => {
                          const val = e.target.value as EisenhowerQuadrant | '';
                          const updated = {
                            ...file,
                            eisenhower: val ? val : undefined,
                            frontmatter: {
                              ...file.frontmatter,
                              ...(val ? { eisenhower: val } : {}),
                            },
                            updatedAt: Date.now(),
                          };
                          if (!val) {
                            delete updated.frontmatter.eisenhower;
                          }
                          await db.files.put(updated);
                          onRefresh();
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer outline-none ${
                          opt ? opt.badgeClass : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                        }`}
                        title={opt ? opt.label : 'Assign Eisenhower priority'}
                      >
                        <option value="">⚪ Unassigned</option>
                        <option value="urgent_important">🔴 Do First</option>
                        <option value="not_urgent_important">🟡 Schedule</option>
                        <option value="urgent_not_important">🔵 Delegate</option>
                        <option value="not_urgent_not_important">⚪ Backlog</option>
                      </select>
                    </div>
                  );
                })()}
              </td>

              {/* Custom Columns */}
              {columns.map((col) => {
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
