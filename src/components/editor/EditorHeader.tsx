'use client';

import React, { useState, useEffect } from 'react';
import { VaultFile, EISENHOWER_CONFIG, EisenhowerQuadrant } from '@/src/lib/storage/db';
import { NoteProperties, DEFAULT_NOTE_PROPERTIES, normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import {
  FileText,
  Code,
  Save,
  Check,
  Trash2,
  Tag as TagIcon,
  User,
  Flag,
  Layers,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EditorHeaderProps {
  file: VaultFile;
  isSaving: boolean;
  saveSuccess: boolean;
  editorMode: 'rich' | 'plain';
  onSwitchToRichText: () => void;
  onSwitchToPlaintext: () => void;
  onManualSave: () => void;
  isSaveDisabled: boolean;
  onUpdateProperties?: (props: Partial<NoteProperties>) => Promise<any> | void;
  onTitleChange?: (newTitle: string) => void;
}

const STATUS_OPTIONS = ['Draft', 'In Progress', 'Completed', 'Archived'] as const;

const EISENHOWER_OPTIONS: Array<{
  value: 'Urgent & Immediate' | 'Urgent & Not Immediate' | 'Not Urgent & Immediate' | 'Not Urgent & Not Immediate';
  label: string;
  dotBg: string;
}> = [
  { value: 'Urgent & Immediate', label: '🔴 Urgent & Immediate (Do First)', dotBg: 'bg-red-500' },
  { value: 'Urgent & Not Immediate', label: '🟡 Urgent & Not Immediate (Schedule)', dotBg: 'bg-yellow-500' },
  { value: 'Not Urgent & Immediate', label: '🔵 Not Urgent & Immediate (Delegate)', dotBg: 'bg-blue-500' },
  { value: 'Not Urgent & Not Immediate', label: '⚪ Not Urgent & Not Immediate (Backlog)', dotBg: 'bg-neutral-400' },
];

export function EditorHeader({
  file,
  isSaving,
  saveSuccess,
  editorMode,
  onSwitchToRichText,
  onSwitchToPlaintext,
  onManualSave,
  isSaveDisabled,
  onUpdateProperties,
  onTitleChange,
}: EditorHeaderProps) {
  const { promptDeleteNote } = useWorkspaceStore();

  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const displayTitle = editingTitle ?? (file.title || file.name.replace(/\.[^/.]+$/, ''));
  const displayAuthor = editingAuthor ?? (file.frontmatter?.author || '');

  const handleDelete = () => {
    promptDeleteNote(file.path, file.title || file.name);
  };

  const handleTitleBlur = () => {
    const trimmed = (editingTitle ?? displayTitle).trim();
    setEditingTitle(null);
    if (trimmed && trimmed !== file.title) {
      onTitleChange?.(trimmed);
      onUpdateProperties?.({ title: trimmed });
    }
  };

  const handleAuthorBlur = () => {
    const trimmed = (editingAuthor ?? displayAuthor).trim();
    setEditingAuthor(null);
    if (trimmed !== (file.frontmatter?.author || '')) {
      onUpdateProperties?.({ author: trimmed });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdateProperties?.({ status: newStatus });
  };

  const handleEisenhowerChange = (newEisenhower: any) => {
    onUpdateProperties?.({ eisenhower: newEisenhower });
  };

  const currentTags = Array.isArray(file.tags) && file.tags.length > 0
    ? file.tags
    : Array.isArray(file.frontmatter?.tags)
    ? file.frontmatter.tags
    : [];

  const handleAddTag = () => {
    const tag = newTagInput.trim().replace(/^#/, '');
    if (!tag) {
      setIsAddingTag(false);
      return;
    }
    const updatedTags = Array.from(new Set([...currentTags, tag]));
    onUpdateProperties?.({ tags: updatedTags });
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter((t: string) => t !== tagToRemove);
    onUpdateProperties?.({ tags: updatedTags });
  };

  const currentStatus = file.frontmatter?.status || DEFAULT_NOTE_PROPERTIES.status;
  const currentEisenhower = normalizeEisenhower(file.eisenhower || file.frontmatter?.eisenhower);
  const eisenhowerConfig = EISENHOWER_CONFIG[currentEisenhower];

  return (
    <div className="sticky top-0 z-20 flex flex-col bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-2xs">
      {/* Top Bar: Path breadcrumb and actions */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-2 text-xs text-neutral-500 min-w-0 flex-1 mr-3">
          <span
            className="truncate font-mono text-[11px] text-[var(--foreground)]/60 shrink min-w-0"
            title={file.path}
          >
            {file.path}
          </span>
          <button
            type="button"
            onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
            className="p-1 rounded text-neutral-500 dark:text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title={isPropertiesExpanded ? 'Hide properties bar' : 'Show properties bar'}
            aria-label="Toggle properties"
          >
            {isPropertiesExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Synced Status: Icon-Only with full tooltip */}
          {isSaving ? (
            <span
              className="flex items-center justify-center p-1 text-amber-500 transition-colors"
              title="Saving changes..."
              aria-label="Saving changes"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </span>
          ) : saveSuccess ? (
            <span
              className="flex items-center justify-center p-1 text-emerald-600 dark:text-emerald-400 transition-colors"
              title="Saved to IndexedDB & live disk"
              aria-label="Saved"
            >
              <Check className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span
              className="flex items-center justify-center p-1 text-neutral-400 dark:text-neutral-500 hover:text-[var(--foreground)] transition-colors"
              title="All changes synced"
              aria-label="Synced"
            >
              <Check className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Mode Toggle: Rich Text Mode vs Plaintext Mode (Icon-Only) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs shadow-2xs">
            <button
              type="button"
              onClick={onSwitchToRichText}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                editorMode === 'rich'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Rich Text Mode (WYSIWYG formatted editing)"
              aria-label="Rich Text Mode"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onSwitchToPlaintext}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                editorMode === 'plain'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Plaintext Mode (Raw Markdown editing)"
              aria-label="Plaintext Mode"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Button (Icon-Only) */}
          <button
            onClick={onManualSave}
            disabled={isSaveDisabled}
            className="p-1.5 rounded-md bg-[var(--card)] hover:bg-[var(--border)]/60 text-[var(--foreground)] border border-[var(--border)] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Save note (⌘S)"
            aria-label="Save note (⌘S)"
          >
            <Save className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Trash Can / Delete Note Button */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Default Properties Controls */}
      {isPropertiesExpanded && (
        <div className="px-6 py-2 border-t border-[var(--border)]/60 bg-[var(--card)]/40 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* 1. Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-12">
                <FileText className="w-3 h-3 text-neutral-400" />
                Title
              </span>
              <input
                type="text"
                value={displayTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                placeholder="Note title"
                className="w-full min-w-0 px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors truncate whitespace-nowrap overflow-hidden text-ellipsis"
              />
            </div>

            {/* 2. Status */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-12">
                <Layers className="w-3 h-3 text-neutral-400" />
                Status
              </span>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] cursor-pointer transition-colors"
              >
                {!STATUS_OPTIONS.includes(currentStatus as any) && (
                  <option value={currentStatus}>{currentStatus}</option>
                )}
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Eisenhower */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-16">
                <Flag className="w-3 h-3 text-neutral-400" />
                Priority
              </span>
              <div className="relative w-full flex items-center">
                <select
                  value={currentEisenhower}
                  onChange={(e) => handleEisenhowerChange(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] cursor-pointer transition-colors truncate"
                  title={`Eisenhower: ${currentEisenhower}`}
                >
                  {EISENHOWER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span
                  className={`absolute left-2 w-2 h-2 rounded-full pointer-events-none ${
                    eisenhowerConfig?.dotBg || 'bg-neutral-400'
                  }`}
                />
              </div>
            </div>

            {/* 4. Author */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-12">
                <User className="w-3 h-3 text-neutral-400" />
                Author
              </span>
              <input
                type="text"
                value={displayAuthor}
                onChange={(e) => setEditingAuthor(e.target.value)}
                onBlur={handleAuthorBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleAuthorBlur()}
                placeholder="Author name"
                className="w-full px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors truncate"
              />
            </div>

            {/* 5. Tags */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-10">
                <TagIcon className="w-3 h-3 text-neutral-400" />
                Tags
              </span>
              <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0 max-h-16 overflow-y-auto">
                {currentTags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[var(--border)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-neutral-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      title={`Remove tag #${tag}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {isAddingTag ? (
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onBlur={handleAddTag}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      } else if (e.key === 'Escape') {
                        setIsAddingTag(false);
                      }
                    }}
                    autoFocus
                    placeholder="tag..."
                    className="w-16 px-1.5 py-0.5 text-[11px] rounded bg-[var(--background)] border border-[var(--accent)] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
                    title="Add tag"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tag</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
