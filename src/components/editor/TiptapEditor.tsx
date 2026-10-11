'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { db } from '@/src/lib/storage/db';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { BlockHandle } from './extensions/BlockHandle';
import { BacklinksPanel } from './BacklinksPanel';
import { useNotePersistence } from '@/src/hooks/useNotePersistence';
import { useEditorDropUpload } from '@/src/hooks/useEditorDropUpload';
import { useEditorSuggestions } from '@/src/hooks/useEditorSuggestions';
import { EditorHeader } from './EditorHeader';
import { BinaryAssetPreview } from './BinaryAssetPreview';
import { PlaintextMarkdownEditor } from './modes/PlaintextMarkdownEditor';
import { FloatingToolbarHost } from './FloatingToolbarHost';
import { EditorBottomToolbar } from './EditorBottomToolbar';
import { getEditorExtensions } from './config/editorExtensions';
import { handleWikiLinkDomClick, autoDetectUnlabeledCodeBlocks } from './config/editorDomHandlers';
import { FileQuestion } from 'lucide-react';

interface TiptapEditorProps {
  filePath: string;
}

export function TiptapEditor({ filePath }: TiptapEditorProps) {
  const { openFileTab, setActiveEditor, activeWorkspaceId } = useWorkspaceStore();
  const {
    file, setFile, title, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, handleSave, handleSaveRaw, updateProperties, saveTimeoutRef,
  } = useNotePersistence({ filePath });

  const [editorMode, setEditorMode] = useState<'rich' | 'plain'>('rich');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const { handleDrop, handlePaste } = useEditorDropUpload({ activeWorkspaceId: activeWorkspaceId || 'default-vault' });

  const {
    slashMenu, wikiMenu, callbacks, filteredCommands, executeCommand, executeWikiLink,
  } = useEditorSuggestions();

  const extensions = useMemo(() => getEditorExtensions(callbacks), [callbacks]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px] text-[15px] leading-[1.8] text-neutral-800 dark:text-neutral-200',
      },
      handleDOMEvents: {
        click: (_view, event) => handleWikiLinkDomClick(event, openFileTab, activeWorkspaceId || 'default-vault'),
        drop: handleDrop,
        paste: handlePaste,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (!file || !currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;
      autoDetectUnlabeledCodeBlocks(currentEditor);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;
        try {
          handleSave(editorHtmlToMarkdown(currentEditor.getHTML()), file);
        } catch (err) {
          console.warn('Auto-save skipped:', err);
        }
      }, 1200);
    },
  }, [filePath, handleDrop, handlePaste, extensions]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.schema && file && !file.isBinary) {
      try {
        const parsed = parseMarkdownContent(file.content || '', file.title);
        const editorHtml = markdownToEditorHtml(parsed.body);
        const currentHtml = editor.getHTML();
        if (currentHtml === '<p></p>' || Math.abs(currentHtml.length - editorHtml.length) > 5) {
          editor.commands.setContent(editorHtml);
          autoDetectUnlabeledCodeBlocks(editor);
        }
      } catch (err) {
        console.warn('Failed to parse note markdown for editor:', err);
      }
    }
  }, [file, editor]);

  useEffect(() => {
    if (editor) setActiveEditor(editor);
    return () => setActiveEditor(null);
  }, [editor, setActiveEditor]);

  const switchToPlaintext = useCallback(() => {
    if (editor && !editor.isDestroyed && editor.schema) {
      try {
        const markdownBody = editorHtmlToMarkdown(editor.getHTML());
        const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
        setRawMarkdown(fullRaw);
        if (file) handleSave(markdownBody, file);
      } catch {
        if (file) setRawMarkdown(file.content || '');
      }
    } else if (file) {
      setRawMarkdown(file.content || '');
    }
    setEditorMode('plain');
  }, [editor, file, handleSave, setRawMarkdown]);

  const switchToRichText = useCallback(() => {
    if (file) {
      handleSaveRaw(rawMarkdown, file);
      try {
        const parsed = parseMarkdownContent(rawMarkdown, file.title);
        const html = markdownToEditorHtml(parsed.body);
        if (editor && !editor.isDestroyed && editor.schema) {
          editor.commands.setContent(html);
          autoDetectUnlabeledCodeBlocks(editor);
        }
      } catch (err) {
        console.warn('Error syncing to rich text:', err);
      }
    }
    setEditorMode('rich');
  }, [editor, file, rawMarkdown, handleSaveRaw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorMode === 'plain') {
          if (file) handleSaveRaw(rawMarkdown, file);
        } else if (editor && !editor.isDestroyed && editor.schema && file) {
          handleSave(editorHtmlToMarkdown(editor.getHTML()), file);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, file, rawMarkdown, editor, handleSaveRaw, handleSave]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-12 text-neutral-400"><div className="animate-pulse text-sm">Loading note...</div></div>;
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 bg-[var(--background)] text-[var(--foreground)] relative">
      <EditorHeader
        file={file}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        editorMode={editorMode}
        onSwitchToRichText={switchToRichText}
        onSwitchToPlaintext={switchToPlaintext}
        onManualSave={() => {
          if (editorMode === 'plain') {
            if (file) handleSaveRaw(rawMarkdown, file);
          } else if (editor && !editor.isDestroyed && editor.schema && file) {
            handleSave(editorHtmlToMarkdown(editor.getHTML()), file);
          }
        }}
        isSaveDisabled={isSaving || (editorMode === 'rich' && (!editor || editor.isDestroyed))}
        onUpdateProperties={updateProperties}
        onTitleChange={setTitle}
      />

      <div className="max-w-4xl w-full mx-auto px-10 py-10 flex-1">
        {editorMode === 'rich' ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (file) setFile({ ...file, title: e.target.value });
              }}
              onBlur={() => {
                const trimmed = title.trim();
                if (file && trimmed && trimmed !== file.title) updateProperties({ title: trimmed });
              }}
              placeholder="Untitled Note"
              className="w-full text-3xl sm:text-4xl font-bold tracking-tight bg-transparent border-none focus:outline-none mb-6 placeholder-neutral-400 dark:placeholder-neutral-600 text-[var(--foreground)]"
            />
            {editor && !editor.isDestroyed && <BlockHandle editor={editor} />}
            {editor && !editor.isDestroyed ? (
              <EditorContent editor={editor} className="min-h-[400px]" />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-neutral-400 animate-pulse text-xs font-mono">Loading note content...</div>
            )}
          </>
        ) : (
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
        )}

        <BacklinksPanel
          currentFile={file}
          onUpdateFile={(updated) => {
            setFile(updated);
            db.files.put(updated);
            if (editorMode === 'plain') {
              const parsed = parseMarkdownContent(rawMarkdown, updated.title);
              setRawMarkdown(serializeMarkdownWithFrontmatter(parsed.body, updated.frontmatter || {}));
            }
          }}
        />
      </div>

      {editorMode === 'rich' && editor && !editor.isDestroyed && <EditorBottomToolbar editor={editor} />}

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
