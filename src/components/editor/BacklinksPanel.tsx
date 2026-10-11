'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { db, VaultFile, BacklinkRecord } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Link2, Unlink, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { NoteMetricsBar } from './components/NoteMetricsBar';
import { NotePropertiesCard } from './components/NotePropertiesCard';

export interface BacklinksPanelProps {
  currentFile: VaultFile | null;
  onUpdateFile: (updatedFile: VaultFile) => void;
  editor?: Editor | null;
  rawMarkdown?: string;
  editorMode?: 'rich' | 'plain' | 'diff';
}

/**
 * BacklinksPanel
 * Renders document metrics (words & tokens) directly above Note Properties,
 * alongside incoming linked references and unlinked note mentions.
 */
export function BacklinksPanel({
  currentFile,
  onUpdateFile,
  editor,
  rawMarkdown,
  editorMode = 'rich',
}: BacklinksPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [linkedRefs, setLinkedRefs] = useState<BacklinkRecord[]>([]);
  const [unlinkedNotes, setUnlinkedNotes] = useState<{ file: VaultFile; snippet: string }[]>([]);

  const { openFileTab } = useWorkspaceStore();

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

      const filteredLinked = linked.filter((l) => l.sourcePath !== currentFile?.path);

      // 2. Unlinked references from other files containing noteTitle
      const allFiles = await db.files.filter((f) => !f.isBinary && !f.isTrash).toArray();
      const unlinked: { file: VaultFile; snippet: string }[] = [];

      for (const f of allFiles) {
        if (f.path === currentFile.path) continue;
        const isAlreadyLinked = filteredLinked.some((l) => l.sourcePath === f.path);
        if (isAlreadyLinked) continue;

        if (f.content && f.content.toLowerCase().includes(noteTitle.toLowerCase())) {
          const idx = f.content.toLowerCase().indexOf(noteTitle.toLowerCase());
          const start = Math.max(0, idx - 40);
          const end = Math.min(f.content.length, idx + noteTitle.length + 40);
          const snippet = `...${f.content.substring(start, end)}...`;
          unlinked.push({ file: f, snippet });
        }
      }

      if (active) {
        setLinkedRefs(filteredLinked);
        setUnlinkedNotes(unlinked);
      }
    }

    loadReferences();

    return () => {
      active = false;
    };
  }, [currentFile]);

  if (!currentFile) return null;

  return (
    <div className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none">
      {/* Live Word & Token Count placed right above NOTE PROPERTIES */}
      <NoteMetricsBar
        editor={editor}
        rawMarkdown={rawMarkdown}
        editorMode={editorMode}
        fallbackContent={currentFile.content}
      />

      {/* Frontmatter Properties Card */}
      <NotePropertiesCard
        currentFile={currentFile}
        onUpdateFile={onUpdateFile}
      />

      {/* Linked References Section */}
      <div className="mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors uppercase tracking-wider mb-2 cursor-pointer"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Linked References ({linkedRefs.length})</span>
          </div>
        </button>

        {isOpen && (
          <div className="space-y-2 mt-2">
            {linkedRefs.length === 0 ? (
              <div className="text-xs text-neutral-400 italic pl-5">
                No notes link directly to this document yet.
              </div>
            ) : (
              linkedRefs.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => openFileTab(ref.sourcePath, ref.sourceTitle)}
                  className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[var(--accent)]" />
                    <span className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">
                      {ref.sourceTitle}
                    </span>
                  </div>
                  {ref.snippet && (
                    <div className="text-[11px] text-neutral-500 line-clamp-2 pl-5.5 font-mono">
                      {ref.snippet}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Unlinked Mentions Section */}
      {unlinkedNotes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            <Unlink className="w-3.5 h-3.5" />
            <span>Unlinked Mentions ({unlinkedNotes.length})</span>
          </div>
          <div className="space-y-2 mt-2">
            {unlinkedNotes.map(({ file, snippet }) => (
              <div
                key={file.id}
                onClick={() => openFileTab(file.path, file.title)}
                className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-neutral-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-medium text-[var(--foreground)] group-hover:underline">
                    {file.title || file.name}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 line-clamp-2 pl-5.5 font-mono">
                  {snippet}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
