'use client';

import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useEditorDropUpload } from '@/src/hooks/useEditorDropUpload';
import { useEditorSuggestions } from '@/src/hooks/useEditorSuggestions';
import { useTiptapInit } from './hooks/useTiptapInit';
import { useEditorAutosave } from './hooks/useEditorAutosave';
import { useEditorProperties } from './hooks/useEditorProperties';
import { useTypewriterScroll } from './hooks/useTypewriterScroll';
import { EditorDragOverlay } from './components/EditorDragOverlay';
import { EditorHeader } from './EditorHeader';
import { BinaryAssetPreview } from './BinaryAssetPreview';
import { DocumentTabBar } from './DocumentTabBar';
import { EditorBody } from './components/EditorBody';
import { EditorOverlays } from './components/EditorOverlays';
import { useContextMenu } from '@/src/hooks/useContextMenu';
import { useKeyboardOffset } from '@/src/hooks/useKeyboardOffset';
import { FileQuestion } from 'lucide-react';

export interface TiptapEditorProps {
  filePath: string;
}

export function TiptapEditor({ filePath }: TiptapEditorProps) {
  const {
    openFileTab, activeWorkspaceId, toolboxPosition, isTypewriterScrolling,
    theme, customThemeColors, editorFontFamily,
  } = useWorkspaceStore();
  const { keyboardOffset, isKeyboardOpen } = useKeyboardOffset();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    file, setFile, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, editorMode,
    handleSave, handleSaveRaw, isDirty,
    handleRevert, handleManualSave,
  } = useEditorAutosave({ filePath });

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPos,
    openMenu: openContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();

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

  const { handleUpdateProperties } = useEditorProperties({
    file,
    editorMode,
    editor,
    rawMarkdown,
    setFile,
    setRawMarkdown,
  });

  useTypewriterScroll({
    editor,
    isTypewriterScrolling,
    scrollContainerRef,
  });

  // Compute effective editor font stack
  const isMono =
    editorFontFamily === 'mono' ||
    (theme === 'custom' && (customThemeColors?.fontFamily === 'JetBrains Mono' || customThemeColors?.fontFamily?.includes('JetBrains Mono')));
  const isSerif =
    editorFontFamily === 'serif' ||
    (theme === 'custom' && (customThemeColors?.fontFamily === 'Merriweather' || customThemeColors?.fontFamily?.includes('Merriweather')));

  const effectiveFontFamily = isMono
    ? 'var(--font-mono)'
    : isSerif
    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
    : 'var(--theme-font-family, var(--font-sans))';
  const fontClass = isMono ? 'font-mono' : isSerif ? 'font-serif' : '';

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
      className="flex-1 flex flex-col h-full overflow-hidden min-w-0 text-[var(--foreground)] relative bg-transparent"
    >
      <EditorDragOverlay
        isDraggingOver={isDraggingOver}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={() => setIsDraggingOver(false)}
      />

      {/* Top Document Tab Bar with Glassmorphic Context Menu */}
      <DocumentTabBar currentPath={file.path} />

      {/* Editor Header: Full width across the entire top edge, flush against sidebar */}
      <EditorHeader
        file={file}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onManualSave={() => handleManualSave(editor)}
        isSaveDisabled={isSaving || (editorMode === 'richtext' && (!editor || editor.isDestroyed))}
        onUpdateProperties={handleUpdateProperties}
        onTitleChange={setTitle}
        isDirty={isDirty}
      />

      {/* Body container: holds the vertical side toolbar, document workspace, outline, and minimap */}
      <EditorBody
        editor={editor}
        file={file}
        rawMarkdown={rawMarkdown}
        editorMode={editorMode}
        toolboxPosition={toolboxPosition}
        scrollContainerRef={scrollContainerRef}
        gutterRef={gutterRef}
        textareaRef={textareaRef}
        isKeyboardOpen={isKeyboardOpen}
        keyboardOffset={keyboardOffset}
        openContextMenu={openContextMenu}
        effectiveFontFamily={effectiveFontFamily}
        fontClass={fontClass}
        onSaveRaw={handleSaveRaw}
        onManualSave={handleManualSave}
        onRevert={handleRevert}
        onUpdateProperties={handleUpdateProperties}
      />

      {/* Overlays: Slash/Wiki popups, iOS Link preview, Editor context menu */}
      <EditorOverlays
        editor={editor}
        filePath={filePath}
        slashMenu={slashMenu}
        wikiMenu={wikiMenu}
        filteredCommands={filteredCommands}
        onExecuteCommand={(item) => executeCommand(item, editor)}
        onExecuteWikiLink={(sugg) => executeWikiLink(sugg, editor)}
        isContextMenuOpen={isContextMenuOpen}
        contextMenuPos={contextMenuPos}
        onCloseContextMenu={closeContextMenu}
      />
    </div>
  );
}
