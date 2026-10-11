'use client';

import React, { useState, useEffect } from 'react';
import { db, VaultFile, BacklinkRecord, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
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
      const allFiles = await db.files.filter((f) => !f.isBinary && !f.isTrash).toArray();
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
      <div className="mb-6 rounded-lg bg-[var(--card)] border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Note Properties</span>
          </div>
          {!isAddingProp && (
            <button
              onClick={() => setIsAddingProp(true)}
              className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Add property</span>
            </button>
          )}
        </div>

        {/* Existing Properties */}
        <div className="space-y-2 text-xs">
          {/* Dedicated Eisenhower Quadrant Selector */}
          <div className="flex items-center justify-between group py-1 border-b border-[var(--border)] pb-2 mb-2">
            <span className="w-28 text-neutral-400 font-medium truncate flex items-center gap-1.5">
              <span>Eisenhower</span>
            </span>
            <select
              value={normalizeEisenhower(currentFile.eisenhower || currentFile.frontmatter?.eisenhower)}
              onChange={(e) => {
                const val = e.target.value as any;
                const updatedFrontmatter = { ...currentFile.frontmatter, eisenhower: val };
                onUpdateFile({
                  ...currentFile,
                  eisenhower: val,
                  frontmatter: updatedFrontmatter,
                  updatedAt: Date.now(),
                });
              }}
              className="flex-1 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              <option value="Urgent & Immediate">🔴 Urgent & Immediate (Do First)</option>
              <option value="Urgent & Not Immediate">🟡 Urgent & Not Immediate (Schedule)</option>
              <option value="Not Urgent & Immediate">🔵 Not Urgent & Immediate (Delegate / Quick)</option>
              <option value="Not Urgent & Not Immediate">⚪ Not Urgent & Not Immediate (Backlog)</option>
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
                    {key === 'status' ? (
                      <select
                        value={String(value || 'Draft')}
                        onChange={(e) => handlePropertyChange('status', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        {['Draft', 'In Progress', 'Completed', 'Archived'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={displayValue}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    )}
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
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--background)] border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
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
          <form onSubmit={handleAddPropertySubmit} className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border)]">
            <input
              type="text"
              placeholder="property name"
              value={newPropKey}
              onChange={(e) => setNewPropKey(e.target.value)}
              className="w-28 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
            <input
              type="text"
              placeholder="value"
              value={newPropValue}
              onChange={(e) => setNewPropValue(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs bg-[var(--accent)] text-white rounded hover:opacity-90 font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingProp(false)}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-[var(--foreground)]"
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
