'use client';

import React from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { VaultFile } from '@/src/lib/storage/db';
import { NoteProperties } from '@/src/lib/markdown/serializer';
import { ToolboxPosition } from '@/src/stores/workspaceStore';
import { BlockHandle } from '../extensions/BlockHandle';
import { BacklinksPanel } from '../BacklinksPanel';
import { PlaintextMarkdownEditor } from '../modes/PlaintextMarkdownEditor';
import { DiffViewer } from '../modes/DiffViewer';
import { EditorBottomToolbar } from '../EditorBottomToolbar';
import { DocumentOutlineHud } from './DocumentOutlineHud';
import { EditorMinimap } from './EditorMinimap';

export interface EditorBodyProps {
  editor: Editor | null;
  file: VaultFile;
  rawMarkdown: string;
  editorMode: 'richtext' | 'plaintext' | 'diff';
  toolboxPosition: ToolboxPosition;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  gutterRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isKeyboardOpen: boolean;
  keyboardOffset: number;
  openContextMenu: (e: React.MouseEvent) => void;
  effectiveFontFamily: string;
  fontClass: string;
  onSaveRaw: (val: string, file: VaultFile) => void;
  onManualSave: (editor: Editor | null) => void;
  onRevert: (editor: Editor | null) => void;
  onUpdateProperties: (props: Partial<NoteProperties> | VaultFile) => Promise<VaultFile | undefined>;
}

export function EditorBody({
  editor,
  file,
  rawMarkdown,
  editorMode,
  toolboxPosition,
  scrollContainerRef,
  gutterRef,
  textareaRef,
  isKeyboardOpen,
  keyboardOffset,
  openContextMenu,
  effectiveFontFamily,
  fontClass,
  onSaveRaw,
  onManualSave,
  onRevert,
  onUpdateProperties,
}: EditorBodyProps) {
  const isRichTextActive = editorMode === 'richtext' && editor && !editor.isDestroyed;

  return (
    <div className="flex-1 flex flex-row overflow-hidden relative min-h-0 bg-transparent">
      {/* Left Toolbar Dock */}
      {isRichTextActive && toolboxPosition === 'left' && (
        <div className="flex flex-col justify-center pl-3 py-4 shrink-0 z-30 animate-in fade-in slide-in-from-left-2">
          <EditorBottomToolbar editor={editor} position="left" />
        </div>
      )}

      {/* Main Note Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onContextMenu={openContextMenu}
        style={
          isKeyboardOpen
            ? { paddingBottom: `${keyboardOffset + 70}px` }
            : undefined
        }
        className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 relative bg-transparent"
      >
        {/* Top Toolbar Dock */}
        {isRichTextActive && toolboxPosition === 'top' && (
          <div className="sticky top-3 z-30 w-full flex justify-center px-4 pt-1 pb-2 shrink-0 animate-in fade-in slide-in-from-top-2">
            <EditorBottomToolbar editor={editor} position="top" />
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto px-4 pt-4 sm:pt-6 md:pt-8 pb-8 sm:px-6 md:px-10 flex-1 bg-transparent">
          {editorMode === 'richtext' ? (
            <>
              {editor && !editor.isDestroyed && <BlockHandle editor={editor} />}
              {editor && !editor.isDestroyed ? (
                <EditorContent
                  editor={editor}
                  style={{ fontFamily: effectiveFontFamily }}
                  className={`min-h-[280px] sm:min-h-[400px] caffeine-editor-content pt-1 sm:pt-2 first:mt-0 [&>*:first-child]:mt-0 [&_.ProseMirror>*:first-child]:mt-0 [&_.tiptap>*:first-child]:mt-0 ${fontClass}`}
                />
              ) : (
                <div className="min-h-[280px] sm:min-h-[400px] flex items-center justify-center text-neutral-400 animate-pulse text-xs font-mono">
                  Loading note content...
                </div>
              )}
            </>
          ) : editorMode === 'plaintext' ? (
            <PlaintextMarkdownEditor
              rawMarkdown={rawMarkdown}
              onMarkdownChange={(val) => onSaveRaw(val, file)}
              onSaveTrigger={(val) => onSaveRaw(val, file)}
              gutterRef={gutterRef}
              textareaRef={textareaRef}
            />
          ) : (
            <DiffViewer
              savedContent={file.content || ''}
              unsavedContent={rawMarkdown}
              onSave={() => onManualSave(editor)}
              onRevert={() => onRevert(editor)}
            />
          )}

          <BacklinksPanel
            currentFile={file}
            editor={editor}
            rawMarkdown={rawMarkdown}
            editorMode={editorMode}
            onUpdateFile={onUpdateProperties}
          />
        </div>

        {/* Bottom Toolbar Dock */}
        {isRichTextActive && toolboxPosition === 'bottom' && (
          <EditorBottomToolbar editor={editor} position="bottom" />
        )}
      </div>

      {/* Document Outline HUD */}
      <DocumentOutlineHud
        editor={editor}
        rawMarkdown={rawMarkdown}
        editorMode={editorMode}
      />

      {/* Editor Minimap */}
      <EditorMinimap
        containerRef={scrollContainerRef}
        content={rawMarkdown || file?.content || ''}
      />

      {/* Right Toolbar Dock */}
      {isRichTextActive && toolboxPosition === 'right' && (
        <div className="flex flex-col justify-center pr-3 py-4 shrink-0 z-30 animate-in fade-in slide-in-from-right-2">
          <EditorBottomToolbar editor={editor} position="right" />
        </div>
      )}
    </div>
  );
}
