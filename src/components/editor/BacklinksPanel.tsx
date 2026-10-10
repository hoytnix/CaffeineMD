'use client';

import React, { useState, useEffect } from 'react';
import { db, VaultFile, BacklinkRecord, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Link2, Unlink, ChevronDown, ChevronRight, Plus, Hash, Tag, FileText } from 'lucide-react';

interface BacklinksPanelProps {
  currentFile: VaultFile | null;
  onUpdateFile: (updatedFile: VaultFile) => void;
}

export function BacklinksPanel({ currentFile, onUpdateFile }: BacklinksPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [linkedRefs, setLinkedRefs] = useState<BacklinkRecord[]>([]);
  const [unlinkedNotes, setUnlinkedNotes] = useState<{ file: VaultFile; snippet: string }[]>([]);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [isAddingProp, setIsAddingProp] = useState(false);

  const { openFileTab, setActiveView, setSelectedTagFilter } = useWorkspaceStore();

  useEffect(() => {
    let active = true;

    async function loadReferences() {
      if (!currentFile) {
        if (active) {
          setLinkedRefs([]);
          setUnlinkedNotes([]);
        }
        return;
      }

      const noteTitle = currentFile.title || currentFile.name.replace(/\.[^/.]+$/, '');

      // 1. Linked references from db.backlinks
      const linked = await db.backlinks
        .where('targetTitle')
        .equalsIgnoreCase(noteTitle)
        .toArray();

      // Filter out self-links
      const filteredLinked = linked.filter((l) => l.sourcePath !== currentFile?.path);

      // 2. Unlinked references from other files containing noteTitle
      const allFiles = await db.files.where('isBinary').equals(0).toArray();
      const unlinked: { file: VaultFile; snippet: string }[] = [];

      const linkedSourcePaths = new Set(filteredLinked.map((l) => l.sourcePath));
      linkedSourcePaths.add(currentFile?.path || '');

      for (const f of allFiles) {
        if (!linkedSourcePaths.has(f.path) && f.content) {
          const index = f.content.toLowerCase().indexOf(noteTitle.toLowerCase());
          if (index !== -1) {
            const start = Math.max(0, index - 40);
            const end = Math.min(f.content.length, index + noteTitle.length + 40);
            const snippet = f.content.slice(start, end).replace(/\n/g, ' ');
            unlinked.push({ file: f, snippet });
          }
        }
      }

      if (active) {
        setLinkedRefs(filteredLinked);
        setUnlinkedNotes(unlinked.slice(0, 10));
      }
    }

    loadReferences();
    return () => {
      active = false;
    };
  }, [currentFile]);

  if (!currentFile) return null;

  const handlePropertyChange = (key: string, value: any) => {
    const updatedFrontmatter = { ...currentFile.frontmatter, [key]: value };
    onUpdateFile({
      ...currentFile,
      frontmatter: updatedFrontmatter,
      updatedAt: Date.now(),
    });
  };

  const handleRemoveProperty = (key: string) => {
    const updatedFrontmatter = { ...currentFile.frontmatter };
    delete updatedFrontmatter[key];
    onUpdateFile({
      ...currentFile,
      frontmatter: updatedFrontmatter,
      updatedAt: Date.now(),
    });
  };

  const handleAddPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropKey.trim()) return;

    handlePropertyChange(newPropKey.trim(), newPropValue.trim());
    setNewPropKey('');
    setNewPropValue('');
    setIsAddingProp(false);
  };

  return (
    <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none">
      {/* Frontmatter Properties Card */}
      <div className="mb-6 rounded-lg bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <Tag className="w-3.5 h-3.5" />
            <span>Note Properties</span>
          </div>
          {!isAddingProp && (
            <button
              onClick={() => setIsAddingProp(true)}
              className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Add property</span>
            </button>
          )}
        </div>

        {/* Existing Properties */}
        <div className="space-y-2 text-xs">
          {/* Dedicated Eisenhower Quadrant Selector */}
          <div className="flex items-center justify-between group py-1 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-2 mb-2">
            <span className="w-28 text-neutral-500 font-medium truncate flex items-center gap-1.5">
              <span>Eisenhower</span>
            </span>
            <select
              value={currentFile.eisenhower || currentFile.frontmatter?.eisenhower || ''}
              onChange={(e) => {
                const val = e.target.value as EisenhowerQuadrant | '';
                const updatedFrontmatter = { ...currentFile.frontmatter };
                if (val) {
                  updatedFrontmatter.eisenhower = val;
                } else {
                  delete updatedFrontmatter.eisenhower;
                }
                onUpdateFile({
                  ...currentFile,
                  eisenhower: val ? (val as EisenhowerQuadrant) : undefined,
                  frontmatter: updatedFrontmatter,
                  updatedAt: Date.now(),
                });
              }}
              className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">None (Unassigned)</option>
              <option value="urgent_important">🔴 Urgent & Immediate (Do First)</option>
              <option value="not_urgent_important">🟡 Urgent & Not Immediate (Schedule)</option>
              <option value="urgent_not_important">🔵 Not Urgent & Immediate (Delegate / Quick)</option>
              <option value="not_urgent_not_important">⚪ Not Urgent & Not Immediate (Don't / Backlog)</option>
            </select>
          </div>

          {Object.entries(currentFile.frontmatter || {})
            .filter(([key]) => key !== 'eisenhower')
            .map(([key, value]) => {
              const displayValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
              return (
                <div key={key} className="flex flex-col group py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="w-28 text-neutral-500 font-medium truncate">{key}</span>
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleRemoveProperty(key)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 p-1 ml-1 transition-opacity cursor-pointer"
                      title="Remove property"
                    >
                      &times;
                    </button>
                  </div>

                  {key === 'tags' && Array.isArray(value) && value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pl-28">
                      {value.map((t: string) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setSelectedTagFilter(t);
                            setActiveView('tags');
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {isAddingProp && (
          <form onSubmit={handleAddPropertySubmit} className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
            <input
              type="text"
              placeholder="property name"
              value={newPropKey}
              onChange={(e) => setNewPropKey(e.target.value)}
              className="w-28 px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="value"
              value={newPropValue}
              onChange={(e) => setNewPropValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingProp(false)}
              className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Linked References Section */}
      <div className="mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left py-1.5 font-medium text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Linked References ({linkedRefs.length})
            </span>
          </div>
          <Link2 className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {isOpen && (
          <div className="mt-2 space-y-2 pl-4">
            {linkedRefs.length === 0 ? (
              <div className="text-xs text-neutral-400 italic">No notes link to this page yet.</div>
            ) : (
              linkedRefs.map((link) => (
                <div
                  key={link.id}
                  onClick={() => openFileTab(link.sourcePath, link.sourceTitle)}
                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400/50 bg-white dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{link.sourceTitle || link.sourcePath}</span>
                  </div>
                  {link.snippet && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono truncate">
                      ...{link.snippet}...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Unlinked References Section */}
      {unlinkedNotes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
          <div className="flex items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Unlink className="w-3.5 h-3.5" />
              <span>Unlinked Mentions ({unlinkedNotes.length})</span>
            </div>
          </div>
          <div className="mt-2 space-y-2 pl-4">
            {unlinkedNotes.map(({ file, snippet }) => (
              <div
                key={file.path}
                onClick={() => openFileTab(file.path, file.title)}
                className="p-2.5 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-400/50 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-100/50 cursor-pointer transition-all"
              >
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {file.title || file.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono truncate">
                  ...{snippet}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
