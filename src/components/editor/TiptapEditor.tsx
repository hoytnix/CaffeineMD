'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { createLowlight, all } from 'lowlight';
import { detectCodeLanguage } from '@/src/lib/markdown/markdownToHtml';

const lowlight = createLowlight(all);

import { db, VaultFile } from '@/src/lib/storage/db';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { SlashCommands, getCommandItems, CommandItem } from './extensions/SlashCommand';
import { WikiLinkNode } from './extensions/WikiLink';
import { BlockHandle } from './extensions/BlockHandle';
import { BacklinksPanel } from './BacklinksPanel';

import { useNotePersistence } from '@/src/hooks/useNotePersistence';
import { EditorHeader } from './EditorHeader';
import { BinaryAssetPreview } from './BinaryAssetPreview';
import { PlaintextMarkdownEditor } from './modes/PlaintextMarkdownEditor';
import { FloatingSlashMenu } from './menus/FloatingSlashMenu';
import { FloatingWikiLinkMenu } from './menus/FloatingWikiLinkMenu';
import Underline from '@tiptap/extension-underline';
import { EditorBottomToolbar } from './EditorBottomToolbar';
import { FileQuestion } from 'lucide-react';

interface TiptapEditorProps {
  filePath: string;
}

export function TiptapEditor({ filePath }: TiptapEditorProps) {
  const { openFileTab, setActiveEditor } = useWorkspaceStore();

  const {
    file,
    setFile,
    title,
    setTitle,
    isSaving,
    saveSuccess,
    loading,
    rawMarkdown,
    setRawMarkdown,
    handleSave,
    handleSaveRaw,
    saveTimeoutRef,
  } = useNotePersistence({ filePath });

  const [editorMode, setEditorMode] = useState<'rich' | 'plain'>('rich');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  // Floating Slash Command State
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    query: string;
    range: any;
    coords: { top: number; left: number } | null;
    selectedIndex: number;
  }>({
    isOpen: false,
    query: '',
    range: null,
    coords: null,
    selectedIndex: 0,
  });

  // Floating WikiLink Suggestion State
  const [wikiMenu, setWikiMenu] = useState<{
    isOpen: boolean;
    query: string;
    range: any;
    coords: { top: number; left: number } | null;
    selectedIndex: number;
    suggestions: Array<{ title: string; path: string; isNew?: boolean }>;
  }>({
    isOpen: false,
    query: '',
    range: null,
    coords: null,
    selectedIndex: 0,
    suggestions: [],
  });

  const autoDetectUnlabeledCodeBlocks = useCallback((currentEditor: any) => {
    if (!currentEditor || currentEditor.isDestroyed || !currentEditor.state) return;
    try {
      const { doc, tr } = currentEditor.state;
      let modified = false;

      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'codeBlock') {
          const currentLang = node.attrs.language;
          // Only auto-detect if code block is unlabeled or default 'plaintext'
          if (!currentLang || currentLang === 'plaintext') {
            const text = node.textContent;
            if (text && text.trim().length >= 4) {
              const detected = detectCodeLanguage(text);
              if (detected && detected !== 'plaintext' && detected !== currentLang) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  language: detected,
                });
                modified = true;
              }
            }
          }
        }
      });

      if (modified) {
        currentEditor.view.dispatch(tr);
      }
    } catch (err) {
      console.warn('Language auto-detection error:', err);
    }
  }, []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          heading: { levels: [1, 2, 3] },
        }),
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: 'plaintext',
        }),
        Placeholder.configure({
          placeholder: 'Type "/" for commands, "[[" to link notes...',
        }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Image.configure({ inline: true, allowBase64: true }),
        WikiLinkNode.configure({
          suggestion: {
            char: '[[',
            allow: ({ state, range }: any) => {
              const $from = state.doc.resolve(range.from);
              if ($from.parent.type.name === 'codeBlock') return false;
              if ($from.marks().some((m: any) => m.type.name === 'code')) return false;
              return true;
            },
            render: () => ({
              onStart: (props: any) => {
                const clientRect = props.clientRect?.();
                setWikiMenu({
                  isOpen: true,
                  query: props.query || '',
                  range: props.range,
                  coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : null,
                  selectedIndex: 0,
                  suggestions: [],
                });
              },
              onUpdate: async (props: any) => {
                const clientRect = props.clientRect?.();
                const q = props.query ? props.query.toLowerCase() : '';
                const allFiles = await db.files.filter((f) => !f.isBinary && !f.isTrash).toArray();
                let matches = allFiles.filter(
                  (f) =>
                    (f.title && f.title.toLowerCase().includes(q)) ||
                    f.name.toLowerCase().includes(q)
                );

                const suggestions: Array<{ title: string; path: string; isNew?: boolean }> = matches.slice(0, 5).map((f) => ({
                  title: f.title || f.name.replace(/\.[^/.]+$/, ''),
                  path: f.path,
                }));

                if (props.query && !suggestions.some((s) => s.title.toLowerCase() === q)) {
                  suggestions.push({
                    title: props.query,
                    path: `${props.query}.md`,
                    isNew: true,
                  });
                }

                setWikiMenu((prev) => ({
                  ...prev,
                  query: props.query || '',
                  range: props.range,
                  coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : prev.coords,
                  suggestions,
                  selectedIndex: 0,
                }));
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  setWikiMenu((prev) => ({ ...prev, isOpen: false }));
                  return true;
                }
                return false;
              },
              onExit: () => {
                setWikiMenu((prev) => ({ ...prev, isOpen: false }));
              },
            }),
          },
        }),
        SlashCommands.configure({
          suggestion: {
            render: () => ({
              onStart: (props: any) => {
                const clientRect = props.clientRect?.();
                setSlashMenu({
                  isOpen: true,
                  query: props.query || '',
                  range: props.range,
                  coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : null,
                  selectedIndex: 0,
                });
              },
              onUpdate: (props: any) => {
                const clientRect = props.clientRect?.();
                setSlashMenu((prev) => ({
                  ...prev,
                  query: props.query || '',
                  range: props.range,
                  coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : prev.coords,
                }));
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                  return true;
                }
                return false;
              },
              onExit: () => {
                setSlashMenu((prev) => ({ ...prev, isOpen: false }));
              },
            }),
          },
        }),
      ],
      editorProps: {
        attributes: {
          class:
            'focus:outline-none min-h-[500px] text-[15px] leading-[1.8] text-neutral-800 dark:text-neutral-200',
        },
        handleDOMEvents: {
          click: (view, event) => {
            const target = event.target as HTMLElement;
            if (target.closest('pre') || target.closest('code')) {
              return false;
            }
            const wikiLinkEl = target.closest('[data-wikilink]') as HTMLElement;
            if (wikiLinkEl) {
              const targetTitle = wikiLinkEl.getAttribute('data-wikilink');
              if (targetTitle) {
                db.files
                  .where('title')
                  .equalsIgnoreCase(targetTitle)
                  .first()
                  .then((found) => {
                    if (found) {
                      openFileTab(found.path, found.title);
                    } else {
                      db.files.get(`${targetTitle}.md`).then((byPath) => {
                        if (byPath) {
                          openFileTab(byPath.path, byPath.title);
                        } else {
                          const newPath = `${targetTitle}.md`;
                          const newNote: VaultFile = {
                            id: newPath,
                            path: newPath,
                            name: `${targetTitle}.md`,
                            title: targetTitle,
                            extension: 'md',
                            content: `# ${targetTitle}\n\nCreated from WikiLink.`,
                            frontmatter: { title: targetTitle },
                            tags: [],
                            isBinary: false,
                            size: 100,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            vaultId: 'default-vault',
                          };
                          db.files.put(newNote).then(() => {
                            openFileTab(newPath, targetTitle);
                          });
                        }
                      });
                    }
                  });
              }
              return true;
            }
            return false;
          },
          drop: (view, event) => {
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
              const droppedFile = files[0];
              if (droppedFile.type.startsWith('image/')) {
                event.preventDefault();
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  if (coordinates) {
                    const node = schema.nodes.image.create({ src, alt: droppedFile.name });
                    const transaction = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(transaction);
                  }
                };
                reader.readAsDataURL(droppedFile);
                return true;
              }
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        if (!file || !currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;

        // Smart Language Detection on unlabeled code blocks
        autoDetectUnlabeledCodeBlocks(currentEditor);

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          if (!currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;
          try {
            const html = currentEditor.getHTML();
            const markdown = editorHtmlToMarkdown(html);
            handleSave(markdown, file);
          } catch (err) {
            console.warn('Auto-save skipped:', err);
          }
        }, 1200);
      },
    },
    [filePath, autoDetectUnlabeledCodeBlocks]
  );

  // Sync Note Content to Tiptap when file loads or switches
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
  }, [file, editor, autoDetectUnlabeledCodeBlocks]);

  // Register editor instance for emoji drawer insertion
  useEffect(() => {
    if (editor) {
      setActiveEditor(editor);
    }
    return () => {
      setActiveEditor(null);
    };
  }, [editor, setActiveEditor]);

  // Mode switching
  const switchToPlaintext = useCallback(() => {
    if (editor && !editor.isDestroyed && editor.schema) {
      try {
        const html = editor.getHTML();
        const markdownBody = editorHtmlToMarkdown(html);
        const fullRaw = serializeMarkdownWithFrontmatter(
          markdownBody,
          file?.frontmatter || {}
        );
        setRawMarkdown(fullRaw);
        if (file) {
          handleSave(markdownBody, file);
        }
      } catch (err) {
        console.warn('Error syncing to raw markdown:', err);
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
  }, [editor, file, rawMarkdown, handleSaveRaw, autoDetectUnlabeledCodeBlocks]);

  // Commands & WikiLink execution
  const filteredCommands = useMemo(() => {
    const all = getCommandItems();
    if (!slashMenu.query) return all;
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
        item.description.toLowerCase().includes(slashMenu.query.toLowerCase())
    );
  }, [slashMenu.query]);

  const executeCommand = (item: CommandItem) => {
    if (!editor || !editor.schema) return;
    editor.chain().focus().deleteRange(slashMenu.range).run();
    item.command({ editor, range: slashMenu.range });
    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const executeWikiLink = (suggestion: { title: string; path: string; isNew?: boolean }) => {
    if (!editor || !editor.schema) return;
    const { state } = editor;
    const $from = state.doc.resolve(state.selection.from);
    if ($from.parent.type.name === 'codeBlock' || $from.marks().some((m) => m.type.name === 'code')) {
      editor
        .chain()
        .focus()
        .deleteRange(wikiMenu.range)
        .insertContent(`[[${suggestion.title}]]`)
        .run();
      setWikiMenu((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    editor
      .chain()
      .focus()
      .deleteRange(wikiMenu.range)
      .insertContent({
        type: 'wikiLink',
        attrs: { target: suggestion.title, label: suggestion.title },
      })
      .run();
    setWikiMenu((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard shortcut ⌘S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorMode === 'plain') {
          if (file) handleSaveRaw(rawMarkdown, file);
        } else {
          if (editor && !editor.isDestroyed && editor.schema && file) {
            try {
              const markdown = editorHtmlToMarkdown(editor.getHTML());
              handleSave(markdown, file);
            } catch (err) {
              console.warn('Save failed:', err);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, file, rawMarkdown, editor, handleSaveRaw, handleSave]);

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
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
          The selected file could not be found in IndexedDB. Select another note from the file tree.
        </p>
      </div>
    );
  }

  if (file.isBinary) {
    return <BinaryAssetPreview file={file} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative">
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
            try {
              const markdown = editorHtmlToMarkdown(editor.getHTML());
              handleSave(markdown, file);
            } catch (err) {
              console.warn('Manual save failed:', err);
            }
          }
        }}
        isSaveDisabled={isSaving || (editorMode === 'rich' && (!editor || editor.isDestroyed))}
      />

      {/* Main Canvas Area */}
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
              placeholder="Untitled Note"
              className="w-full text-3xl sm:text-4xl font-bold tracking-tight bg-transparent border-none focus:outline-none mb-6 placeholder-neutral-300 dark:placeholder-neutral-700"
            />

            {editor && !editor.isDestroyed && <BlockHandle editor={editor} />}

            {editor && !editor.isDestroyed ? (
              <EditorContent editor={editor} className="min-h-[400px]" />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-neutral-400 dark:text-neutral-600 animate-pulse text-xs font-mono">
                Loading note content...
              </div>
            )}
          </>
        ) : (
          <PlaintextMarkdownEditor
            rawMarkdown={rawMarkdown}
            onMarkdownChange={setRawMarkdown}
            onSaveTrigger={(val) => {
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              if (file) {
                saveTimeoutRef.current = setTimeout(() => {
                  handleSaveRaw(val, file);
                }, 1200);
              }
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
              const reSerialized = serializeMarkdownWithFrontmatter(parsed.body, updated.frontmatter || {});
              setRawMarkdown(reSerialized);
            }
          }}
        />
      </div>

      {editorMode === 'rich' && editor && !editor.isDestroyed && (
        <EditorBottomToolbar editor={editor} />
      )}

      <FloatingSlashMenu
        isOpen={slashMenu.isOpen}
        coords={slashMenu.coords}
        selectedIndex={slashMenu.selectedIndex}
        filteredCommands={filteredCommands}
        onExecuteCommand={executeCommand}
      />

      <FloatingWikiLinkMenu
        isOpen={wikiMenu.isOpen}
        coords={wikiMenu.coords}
        selectedIndex={wikiMenu.selectedIndex}
        suggestions={wikiMenu.suggestions}
        onExecuteWikiLink={executeWikiLink}
      />
    </div>
  );
}
