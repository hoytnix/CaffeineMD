'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { db } from '@/src/lib/storage/db';
import { parseMarkdownContent, serializeMarkdownWithFrontmatter } from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { BlockHandle } from './extensions/BlockHandle';
import { BacklinksPanel } from './BacklinksPanel';
import { useEditorDropUpload } from '@/src/hooks/useEditorDropUpload';
import { useEditorSuggestions } from '@/src/hooks/useEditorSuggestions';
import { useTiptapInit } from './hooks/useTiptapInit';
import { useEditorAutosave } from './hooks/useEditorAutosave';
import { EditorDragOverlay } from './components/EditorDragOverlay';
import { EditorHeader } from './EditorHeader';
import { BinaryAssetPreview } from './BinaryAssetPreview';
import { PlaintextMarkdownEditor } from './modes/PlaintextMarkdownEditor';
import { DiffViewer } from './modes/DiffViewer';
import { FloatingToolbarHost } from './FloatingToolbarHost';
import { EditorBottomToolbar } from './EditorBottomToolbar';
import { FileQuestion } from 'lucide-react';

export interface TiptapEditorProps {
  filePath: string;
}

export function TiptapEditor({ filePath }: TiptapEditorProps) {
  const { openFileTab, activeWorkspaceId, toolboxPosition } = useWorkspaceStore();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    file, setFile, title, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, editorMode,
    handleSave, handleSaveRaw, updateProperties, saveTimeoutRef,
    switchToPlaintext, switchToRichText, switchToDiff, handleRevert, handleManualSave,
  } = useEditorAutosave({ filePath });

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Auto-resize title textarea to overflow to new lines without scrolling
  useEffect(() => {
    const adjustHeight = () => {
      if (titleTextareaRef.current) {
        titleTextareaRef.current.style.height = 'auto';
        titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
      }
    };
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [title]);

  const { handleDrop, handlePaste } = useEditorDropUpload({
    activeWorkspaceId: activeWorkspaceId || 'default-vault',
  });

  const {
    slashMenu, wikiMenu, callbacks, filteredCommands, executeCommand, executeWikiLink,
  } = useEditorSuggestions();

  const { editor } = useTiptapInit({
    filePath,
    file,
    callbacks,
    activeWorkspaceId: activeWorkspaceId || 'default-vault',
    openFileTab,
    handleDrop,
    handlePaste,
    onAutoSave: handleSave,
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-neutral-400">
        <div className="animate-pulse text-sm">Loading note...</div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-500">
        <FileQuestion className="w-12 h-12 text-neutral-400 mb-3" />
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Note not found</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">The selected file could not be found in IndexedDB.</p>
      </div>
    );
  }

  if (file.isBinary) return <BinaryAssetPreview file={file} />;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={() => setIsDraggingOver(false)}
      className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[var(--background)] text-[var(--foreground)] relative"
    >
      <EditorDragOverlay
        isDraggingOver={isDraggingOver}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={() => setIsDraggingOver(false)}
      />

      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* Left Toolbar Dock */}
        {editorMode === 'rich' && editor && !editor.isDestroyed && toolboxPosition === 'left' && (
          <div className="flex flex-col justify-center pl-3 py-4 shrink-0 z-30 animate-in fade-in slide-in-from-left-2">
            <EditorBottomToolbar editor={editor} position="left" />
          </div>
        )}

        {/* Main Note Scrollable Container */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 relative">
          <EditorHeader
            file={file}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            editorMode={editorMode}
            onSwitchToRichText={() => switchToRichText(editor)}
            onSwitchToPlaintext={() => switchToPlaintext(editor)}
            onSwitchToDiff={() => switchToDiff(editor)}
            onManualSave={() => handleManualSave(editor)}
            isSaveDisabled={isSaving || (editorMode === 'rich' && (!editor || editor.isDestroyed))}
            onUpdateProperties={updateProperties}
            onTitleChange={setTitle}
          />

          {/* Top Toolbar Dock */}
          {editorMode === 'rich' && editor && !editor.isDestroyed && toolboxPosition === 'top' && (
            <div className="sticky top-3 z-30 w-full flex justify-center px-4 pt-1 pb-2 shrink-0 animate-in fade-in slide-in-from-top-2">
              <EditorBottomToolbar editor={editor} position="top" />
            </div>
          )}

          <div className="max-w-4xl w-full mx-auto px-4 pt-2 sm:pt-4 md:pt-6 pb-8 sm:px-6 md:px-10 flex-1">
            {editorMode === 'rich' ? (
              <>
                <textarea
                  ref={titleTextareaRef}
                  rows={1}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (file) setFile({ ...file, title: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      editor?.commands.focus('start');
                    }
                  }}
                  onBlur={() => {
                    const trimmed = title.trim();
                    if (file && trimmed && trimmed !== file.title) updateProperties({ title: trimmed });
                  }}
                  placeholder="Untitled Note"
                  className="w-full text-2xl sm:text-4xl font-bold tracking-tight bg-transparent border-none focus:outline-none mb-2 sm:mb-4 md:mb-6 placeholder-neutral-400 dark:placeholder-neutral-600 text-[var(--foreground)] resize-none overflow-hidden break-words leading-tight block"
                />
                {editor && !editor.isDestroyed && <BlockHandle editor={editor} />}
                {editor && !editor.isDestroyed ? (
                  <EditorContent
                    editor={editor}
                    className="min-h-[280px] sm:min-h-[400px] kite-editor-content pt-1 sm:pt-2 first:mt-0 [&>*:first-child]:mt-0 [&_.ProseMirror>*:first-child]:mt-0 [&_.tiptap>*:first-child]:mt-0"
                  />
                ) : (
                  <div className="min-h-[280px] sm:min-h-[400px] flex items-center justify-center text-neutral-400 animate-pulse text-xs font-mono">
                    Loading note content...
                  </div>
                )}
              </>
            ) : editorMode === 'plain' ? (
              <PlaintextMarkdownEditor
                rawMarkdown={rawMarkdown}
                onMarkdownChange={setRawMarkdown}
                onSaveTrigger={(val) => {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  if (file) saveTimeoutRef.current = setTimeout(() => handleSaveRaw(val, file), 1200);
                }}
                gutterRef={gutterRef}
                textareaRef={textareaRef}
              />
            ) : (
              <DiffViewer
                savedContent={file.content || ''}
                unsavedContent={rawMarkdown}
                onSave={() => {
                  if (file) handleSaveRaw(rawMarkdown, file);
                }}
                onRevert={() => handleRevert(editor)}
              />
            )}

            <BacklinksPanel
              currentFile={file}
              editor={editor}
              rawMarkdown={rawMarkdown}
              editorMode={editorMode}
              onUpdateFile={(updated) => {
                setFile(updated);
                db.files.put(updated);
                if (editorMode === 'plain' || editorMode === 'diff') {
                  const parsed = parseMarkdownContent(rawMarkdown, updated.title);
                  setRawMarkdown(serializeMarkdownWithFrontmatter(parsed.body, updated.frontmatter || {}));
                }
              }}
            />
          </div>

          {/* Bottom Toolbar Dock */}
          {editorMode === 'rich' && editor && !editor.isDestroyed && toolboxPosition === 'bottom' && (
            <EditorBottomToolbar editor={editor} position="bottom" />
          )}
        </div>

        {/* Right Toolbar Dock */}
        {editorMode === 'rich' && editor && !editor.isDestroyed && toolboxPosition === 'right' && (
          <div className="flex flex-col justify-center pr-3 py-4 shrink-0 z-30 animate-in fade-in slide-in-from-right-2">
            <EditorBottomToolbar editor={editor} position="right" />
          </div>
        )}
      </div>

      <FloatingToolbarHost
        slashMenu={slashMenu}
        wikiMenu={wikiMenu}
        filteredCommands={filteredCommands}
        onExecuteCommand={(item) => executeCommand(item, editor)}
        onExecuteWikiLink={(sugg) => executeWikiLink(sugg, editor)}
      />
    </div>
  );
}
