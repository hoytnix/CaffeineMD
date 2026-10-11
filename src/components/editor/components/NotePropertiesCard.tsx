'use client';

import React, { useState } from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Plus, Tag, ChevronDown, ChevronRight } from 'lucide-react';

export interface NotePropertiesCardProps {
  currentFile: VaultFile;
  onUpdateFile: (updatedFile: VaultFile) => void;
}

/**
 * NotePropertiesCard
 * Renders the frontmatter properties inspector card (Eisenhower Matrix quadrant,
 * status dropdown, tags, and arbitrary custom metadata properties).
 */
export function NotePropertiesCard({
  currentFile,
  onUpdateFile,
}: NotePropertiesCardProps) {
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setActiveView, setSelectedTagFilter } = useWorkspaceStore();

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

  const customProperties = Object.entries(currentFile.frontmatter || {}).filter(
    ([key]) => key !== 'eisenhower'
  );
  const hasFields = customProperties.length > 0 || Boolean(currentFile.eisenhower || currentFile.frontmatter?.eisenhower);
  const isEffectivelyCollapsed = isCollapsed || (!hasFields && !isAddingProp);

  return (
    <div
      className={`rounded-lg bg-[var(--card)] border border-[var(--border)] select-none transition-all ${
        isEffectivelyCollapsed
          ? 'mb-2 sm:mb-3 p-2.5 sm:p-3'
          : 'mb-3 sm:mb-6 p-3 sm:p-4'
      }`}
    >
      <div className={`flex items-center justify-between ${isEffectivelyCollapsed ? '' : 'mb-3'}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand properties' : 'Collapse properties'}
          aria-label="Toggle properties"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <Tag className="w-3.5 h-3.5" />
          <span>Note Properties</span>
          {isCollapsed && (
            <span className="text-[10px] font-mono text-neutral-500 font-normal">
              ({customProperties.length + (currentFile.eisenhower || currentFile.frontmatter?.eisenhower ? 1 : 0)})
            </span>
          )}
        </button>
        {!isEffectivelyCollapsed && !isAddingProp && (
          <button
            onClick={() => setIsAddingProp(true)}
            className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add property</span>
          </button>
        )}
      </div>

      {!isEffectivelyCollapsed && (
        <>
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
            className="px-2.5 py-1 text-xs bg-[var(--accent)] text-white rounded hover:opacity-90 font-medium cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingProp(false)}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-[var(--foreground)] cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}
        </>
      )}
    </div>
  );
}
