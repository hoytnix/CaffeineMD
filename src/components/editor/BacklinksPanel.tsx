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
  editorMode?: 'richtext' | 'plaintext' | 'diff' | 'rich' | 'plain';
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
  const [linkedOpen, setLinkedOpen] = useState(true);
  const [unlinkedOpen, setUnlinkedOpen] = useState(false);
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
    <div className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-[var(--theme-border,var(--border))] text-[var(--theme-text-primary,var(--foreground))] select-none">
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
          type="button"
          onClick={() => setLinkedOpen(!linkedOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-primary,var(--foreground))] hover:text-[var(--theme-accent,#6366f1)] transition-colors uppercase tracking-wider mb-2 cursor-pointer select-none"
        >
          {linkedOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--theme-accent,#6366f1)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          )}
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-[var(--theme-accent,#6366f1)]" />
            <span>Linked References</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--theme-bg-card,var(--card))] border border-[var(--theme-border,var(--border))] text-[var(--theme-text-primary,var(--foreground))]">
              {linkedRefs.length}
            </span>
          </div>
        </button>

        {linkedOpen && (
          <div className="space-y-2 mt-2">
            {linkedRefs.length === 0 ? (
              <div className="text-xs text-neutral-400 italic pl-5 py-1">
                No notes link directly to this document yet.
              </div>
            ) : (
              linkedRefs.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => openFileTab(ref.sourcePath, ref.sourceTitle)}
                  className="p-2.5 rounded-lg border border-[var(--theme-border,var(--border))] bg-[var(--theme-bg-card,var(--card))] hover:border-[var(--theme-accent,#6366f1)] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[var(--theme-accent,#6366f1)]" />
                    <span className="text-xs font-medium text-[var(--theme-text-primary,var(--foreground))] group-hover:text-[var(--theme-accent,#6366f1)]">
                      {ref.sourceTitle}
                    </span>
                  </div>
                  {ref.snippet && (
                    <div className="text-[11px] text-neutral-400 line-clamp-2 pl-5.5 font-mono">
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
      <div className="mt-6 pt-4 border-t border-[var(--theme-border,var(--border))]">
        <button
          type="button"
          onClick={() => setUnlinkedOpen(!unlinkedOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-primary,var(--foreground))] hover:text-[var(--theme-accent,#6366f1)] transition-colors uppercase tracking-wider mb-2 cursor-pointer select-none"
        >
          {unlinkedOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--theme-accent,#6366f1)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          )}
          <div className="flex items-center gap-1.5">
            <Unlink className="w-3.5 h-3.5 text-amber-500/80" />
            <span>Unlinked Mentions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--theme-bg-card,var(--card))] border border-[var(--theme-border,var(--border))] text-[var(--theme-text-primary,var(--foreground))]">
              {unlinkedNotes.length}
            </span>
          </div>
        </button>

        {unlinkedOpen && (
          <div className="space-y-2 mt-2">
            {unlinkedNotes.length === 0 ? (
              <div className="text-xs text-neutral-400 italic pl-5 py-1">
                No unlinked mentions found for this document.
              </div>
            ) : (
              unlinkedNotes.map(({ file, snippet }) => (
                <div
                  key={file.id}
                  onClick={() => openFileTab(file.path, file.title)}
                  className="p-2.5 rounded-lg border border-[var(--theme-border,var(--border))] bg-[var(--theme-bg-card,var(--card))] hover:border-[var(--theme-accent,#6366f1)] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[var(--theme-accent,#6366f1)]" />
                    <span className="text-xs font-medium text-[var(--theme-text-primary,var(--foreground))] group-hover:text-[var(--theme-accent,#6366f1)]">
                      {file.title || file.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 line-clamp-2 pl-5.5 font-mono">
                    {snippet}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
