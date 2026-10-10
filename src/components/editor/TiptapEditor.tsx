'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';

import { db, VaultFile, BacklinkRecord } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { SlashCommands, SlashCommandPluginKey, getCommandItems, CommandItem } from './extensions/SlashCommand';
import { WikiLinkNode, WikiLinkPluginKey } from './extensions/WikiLink';
import { BlockHandle } from './extensions/BlockHandle';
import { BacklinksPanel } from './BacklinksPanel';

import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Info,
  Code,
  Table as TableIcon,
  Minus,
  Link2,
  Calendar,
  Tag,
  Save,
  Check,
  FileText,
  FileQuestion,
  Quote,
} from 'lucide-react';

interface TiptapEditorProps {
  filePath: string;
}

export function TiptapEditor({ filePath }: TiptapEditorProps) {
  const [file, setFile] = useState<VaultFile | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editor Mode: 'rich' (WYSIWYG Tiptap) vs 'plain' (Raw Markdown Textarea)
  const [editorMode, setEditorMode] = useState<'rich' | 'plain'>('rich');
  const [rawMarkdown, setRawMarkdown] = useState('');

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

  const { openFileTab } = useWorkspaceStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load Note from DB
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const record = await db.files.get(filePath);
      if (isMounted) {
        if (record) {
          setFile(record);
          setTitle(record.title || record.name.replace(/\.[^/.]+$/, ''));
          setRawMarkdown(record.content || '');
        } else {
          setFile(null);
          setRawMarkdown('');
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [filePath]);

  // Handle saving in Rich Text Mode
  const handleSave = useCallback(
    async (newMarkdownBody: string, currentFile: VaultFile) => {
      setIsSaving(true);
      const fullSerialized = serializeMarkdownWithFrontmatter(
        newMarkdownBody,
        currentFile.frontmatter || {}
      );

      const parsed = parseMarkdownContent(fullSerialized, currentFile.title);

      const updatedFile: VaultFile = {
        ...currentFile,
        title: title || parsed.title,
        content: fullSerialized,
        frontmatter: parsed.frontmatter,
        tags: parsed.tags,
        updatedAt: Date.now(),
      };

      // 1. Save to IndexedDB
      await db.files.put(updatedFile);

      // 2. Update Backlinks
      await db.backlinks.where('sourcePath').equals(updatedFile.path).delete();
      for (const wl of parsed.wikiLinks) {
        await db.backlinks.put({
          id: `${updatedFile.path}::${wl.target}`,
          sourcePath: updatedFile.path,
          sourceTitle: updatedFile.title,
          targetTitle: wl.target,
          snippet: wl.raw,
          vaultId: updatedFile.vaultId,
        });
      }

      // 3. Write back to disk if native folder is bound
      await NativeFileSystemAdapter.writeBackToFile(updatedFile.path, fullSerialized);

      setFile(updatedFile);
      setRawMarkdown(fullSerialized);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    },
    [title]
  );

  // Handle saving in Plaintext Mode (raw markdown with frontmatter)
  const handleSaveRaw = useCallback(
    async (newRawContent: string, currentFile: VaultFile) => {
      setIsSaving(true);
      const parsed = parseMarkdownContent(newRawContent, currentFile.title);

      const updatedFile: VaultFile = {
        ...currentFile,
        title: parsed.title || title || currentFile.title,
        content: newRawContent,
        frontmatter: parsed.frontmatter,
        tags: parsed.tags,
        updatedAt: Date.now(),
      };

      // 1. Save to IndexedDB
      await db.files.put(updatedFile);

      // 2. Update Backlinks
      await db.backlinks.where('sourcePath').equals(updatedFile.path).delete();
      for (const wl of parsed.wikiLinks) {
        await db.backlinks.put({
          id: `${updatedFile.path}::${wl.target}`,
          sourcePath: updatedFile.path,
          sourceTitle: updatedFile.title,
          targetTitle: wl.target,
          snippet: wl.raw,
          vaultId: updatedFile.vaultId,
        });
      }

      // 3. Write back to disk if native folder is bound
      await NativeFileSystemAdapter.writeBackToFile(updatedFile.path, newRawContent);

      setFile(updatedFile);
      setRawMarkdown(newRawContent);
      if (parsed.title && parsed.title !== title) {
        setTitle(parsed.title);
      }
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    },
    [title]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
        }),
        Placeholder.configure({
          placeholder: 'Type "/" for commands, "[[" to link notes...',
        }),
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
            pluginKey: WikiLinkPluginKey,
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
              onUpdate: (props: any) => {
                const clientRect = props.clientRect?.();
                setWikiMenu((prev) => ({
                  ...prev,
                  query: props.query || '',
                  range: props.range,
                  coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : prev.coords,
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
            char: '/',
            pluginKey: SlashCommandPluginKey,
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
            const wikiLinkEl = target.closest('[data-wikilink]') as HTMLElement;
            if (wikiLinkEl) {
              const targetTitle = wikiLinkEl.getAttribute('data-wikilink');
              if (targetTitle) {
                // Find file or open new note
                db.files
                  .where('title')
                  .equalsIgnoreCase(targetTitle)
                  .first()
                  .then((found) => {
                    if (found) {
                      openFileTab(found.path, found.title);
                    } else {
                      // Check by path
                      db.files.get(`${targetTitle}.md`).then((byPath) => {
                        if (byPath) {
                          openFileTab(byPath.path, byPath.title);
                        } else {
                          // Quick create note placeholder
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
            // Check for dropped media assets
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
              const file = files[0];
              if (file.type.startsWith('image/')) {
                event.preventDefault();
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  if (coordinates) {
                    const node = schema.nodes.image.create({ src, alt: file.name });
                    const transaction = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(transaction);
                  }
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        if (!file || !editor || editor.isDestroyed || !editor.schema) return;

        // Debounce auto-save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          if (!editor || editor.isDestroyed || !editor.schema) return;
          try {
            // Convert editor HTML to markdown
            const html = editor.getHTML();
            const markdown = editorHtmlToMarkdown(html);
            handleSave(markdown, file);
          } catch (err) {
            console.warn('Auto-save skipped:', err);
          }
        }, 1200);
      },
    },
    [filePath]
  );

  // Switch to Plaintext Mode (Raw Markdown)
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
  }, [editor, file, handleSave]);

  // Switch to Rich Text Mode (WYSIWYG Tiptap)
  const switchToRichText = useCallback(() => {
    if (file) {
      handleSaveRaw(rawMarkdown, file);
      const parsed = parseMarkdownContent(rawMarkdown, title);
      if (editor && !editor.isDestroyed && editor.schema) {
        const contentToSet = parsed.body.trim() ? markdownToEditorHtml(parsed.body) : '<p></p>';
        try {
          editor.commands.setContent(contentToSet, { emitUpdate: false });
        } catch (err) {
          console.warn('Error updating rich editor content:', err);
        }
      }
    }
    setEditorMode('rich');
  }, [file, rawMarkdown, title, editor, handleSaveRaw]);

  // Set initial content when file loads
  useEffect(() => {
    if (editor && file && !editor.isDestroyed && editor.schema) {
      const parsed = parseMarkdownContent(file.content || '', file.title);
      // If content is empty, start fresh, else parse body
      const contentToSet = parsed.body.trim() ? markdownToEditorHtml(parsed.body) : '<p></p>';
      try {
        editor.commands.setContent(contentToSet, { emitUpdate: false });
      } catch (err) {
        console.warn('Error setting editor content:', err);
      }
    }
  }, [file, editor]);

  // Update suggestions for WikiLink popover
  useEffect(() => {
    if (!wikiMenu.isOpen) return;

    db.files
      .where('isBinary')
      .equals(0)
      .toArray()
      .then((allFiles) => {
        const queryLower = wikiMenu.query.toLowerCase().trim();
        const matches: Array<{ title: string; path: string; isNew?: boolean }> = allFiles
          .filter((f) => f.title?.toLowerCase().includes(queryLower) || f.name.toLowerCase().includes(queryLower))
          .slice(0, 7)
          .map((f) => ({ title: f.title || f.name.replace(/\.[^/.]+$/, ''), path: f.path }));

        // If no exact match and query not empty, offer creating note
        const exact = matches.some((m) => m.title.toLowerCase() === queryLower);
        if (queryLower && !exact) {
          matches.push({
            title: wikiMenu.query,
            path: `${wikiMenu.query}.md`,
            isNew: true,
          });
        }

        setWikiMenu((prev) => ({
          ...prev,
          suggestions: matches,
          selectedIndex: 0,
        }));
      });
  }, [wikiMenu.isOpen, wikiMenu.query]);

  // Handle Command selection
  const executeCommand = useCallback(
    (item: CommandItem) => {
      if (!editor || editor.isDestroyed || !editor.schema || !slashMenu.range) return;
      item.command({ editor, range: slashMenu.range });
      setSlashMenu((prev) => ({ ...prev, isOpen: false }));
    },
    [editor, slashMenu.range]
  );

  // Handle WikiLink selection
  const executeWikiLink = useCallback(
    (suggestion: { title: string; path: string; isNew?: boolean }) => {
      if (!editor || editor.isDestroyed || !editor.schema || !wikiMenu.range) return;
      editor
        .chain()
        .focus()
        .deleteRange(wikiMenu.range)
        .insertContent({
          type: 'wikiLink',
          attrs: { target: suggestion.title, alias: suggestion.title },
        })
        .insertContent(' ')
        .run();

      if (suggestion.isNew) {
        // Create new note placeholder
        const timestamp = Date.now();
        const newFile: VaultFile = {
          id: suggestion.path,
          path: suggestion.path,
          name: `${suggestion.title}.md`,
          title: suggestion.title,
          extension: 'md',
          content: `# ${suggestion.title}\n\n`,
          frontmatter: { title: suggestion.title },
          tags: [],
          isBinary: false,
          size: 50,
          createdAt: timestamp,
          updatedAt: timestamp,
          vaultId: 'default-vault',
        };
        db.files.put(newFile);
      }

      setWikiMenu((prev) => ({ ...prev, isOpen: false }));
    },
    [editor, wikiMenu.range]
  );

  // Filter commands
  const filteredCommands = getCommandItems().filter((item) =>
    item.title.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
    item.description.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  // Plaintext Change Handler with Debounced Auto-Save
  const handlePlaintextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawMarkdown(val);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!file) return;

    saveTimeoutRef.current = setTimeout(() => {
      handleSaveRaw(val, file);
    }, 1200);
  };

  // Plaintext Tab & Shortcut Handler
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === '  ') {
          const newValue = value.slice(0, lineStart) + value.slice(lineStart + 2);
          setRawMarkdown(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(start - 2, lineStart);
            textarea.selectionEnd = Math.max(end - 2, lineStart);
          }, 0);
        }
      } else {
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setRawMarkdown(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const insertMarkdownSnippet = (snippet: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + snippet + currentVal.substring(end);
    setRawMarkdown(newVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = cursorOffset !== undefined ? start + cursorOffset : start + snippet.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }, 0);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (file) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveRaw(newVal, file);
      }, 1200);
    }
  };

  // Global ⌘S / Ctrl+S Save Shortcut
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

  const getIcon = (name: string) => {
    switch (name) {
      case 'Heading1': return <Heading1 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Heading2': return <Heading2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Heading3': return <Heading3 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'List': return <List className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'ListOrdered': return <ListOrdered className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Info': return <Info className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Code': return <Code className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Table': return <TableIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Link2': return <Link2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      default: return <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
    }
  };

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

  // Handle Binary Asset Preview
  if (file.isBinary) {
    let previewUrl = '';
    if (file.blob) {
      previewUrl = URL.createObjectURL(file.blob);
    }

    return (
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
        <div className="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold">{file.name}</h1>
          <div className="text-xs text-neutral-400 mt-1">
            Path: {file.path} · Type: {file.mimeType} · Size: {(file.size / 1024).toFixed(1)} KB
          </div>
        </div>
        {file.mimeType?.startsWith('image/') && previewUrl ? (
          <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={file.name} className="max-w-full max-h-[600px] object-contain rounded-lg" />
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
            <FileText className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
            <div className="text-sm font-semibold">Binary Attachment</div>
            <div className="text-xs text-neutral-500 mt-1">{file.mimeType}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative">
      {/* Top Document Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-2 text-xs text-neutral-500 truncate">
          <span className="truncate">{file.path}</span>
          {file.tags && file.tags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 truncate">
                {file.tags.map((tag) => (
                  <span key={tag} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isSaving ? (
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Saving...
            </span>
          ) : saveSuccess ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          ) : (
            <span className="text-xs text-neutral-400">Synced</span>
          )}

          {/* Mode Toggle: Rich Text Mode vs Plaintext Mode */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (editorMode !== 'rich') {
                  switchToRichText();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                editorMode === 'rich'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
              title="Rich Text Mode (WYSIWYG formatted editing)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rich Text</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (editorMode !== 'plain') {
                  switchToPlaintext();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                editorMode === 'plain'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
              title="Plaintext Mode (Raw Markdown editing)"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plaintext</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={() => {
              if (editorMode === 'plain') {
                if (file) handleSaveRaw(rawMarkdown, file);
              } else {
                if (editor && !editor.isDestroyed && editor.schema && file) {
                  try {
                    const markdown = editorHtmlToMarkdown(editor.getHTML());
                    handleSave(markdown, file);
                  } catch (err) {
                    console.warn('Manual save failed:', err);
                  }
                }
              }
            }}
            disabled={isSaving || (editorMode === 'rich' && (!editor || editor.isDestroyed))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Save note (⌘S)"
          >
            <Save className="w-3.5 h-3.5 text-neutral-500" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="max-w-4xl w-full mx-auto px-10 py-10 flex-1">
        {editorMode === 'rich' ? (
          <>
            {/* Document Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (file) {
                  setFile({ ...file, title: e.target.value });
                }
              }}
              placeholder="Untitled Note"
              className="w-full text-3xl sm:text-4xl font-bold tracking-tight bg-transparent border-none focus:outline-none mb-6 placeholder-neutral-300 dark:placeholder-neutral-700"
            />

            {/* Tiptap Block Handle */}
            {editor && !editor.isDestroyed && <BlockHandle editor={editor} />}

            {/* Tiptap Content Editor */}
            {editor && !editor.isDestroyed ? (
              <EditorContent editor={editor} className="min-h-[400px]" />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-neutral-400 dark:text-neutral-600 animate-pulse text-xs font-mono">
                Loading note content...
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Plaintext Subheader & Markdown Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                  <Code className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Plaintext Mode (Raw Markdown)</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                  <span>{rawMarkdown.split('\n').length} lines</span>
                  <span>·</span>
                  <span>{rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0} words</span>
                  <span>·</span>
                  <span>{rawMarkdown.length} chars</span>
                </div>
              </div>

              {/* Quick Syntax Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('[[', 2)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert WikiLink [[Target]]"
                >
                  [[WikiLink]]
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('# ')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Heading"
                >
                  # H1
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('## ')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Subheading"
                >
                  ## H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('- [ ] ')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Task Checkbox"
                >
                  - [ ] Task
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('**bold**', 6)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Bold Text"
                >
                  **Bold**
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('`code`', 5)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Inline Code"
                >
                  `Code`
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdownSnippet('> ')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Insert Quote"
                >
                  &gt; Quote
                </button>
              </div>
            </div>

            {/* Line Numbered Raw Markdown Editor */}
            <div className="relative flex rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-hidden shadow-2xs focus-within:border-neutral-400 dark:focus-within:border-neutral-600 transition-colors">
              {/* Line Numbers Gutter */}
              <div
                ref={gutterRef}
                className="w-11 select-none py-4 pr-2.5 text-right font-mono text-[13px] leading-7 text-neutral-400/80 dark:text-neutral-600 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/40 dark:bg-neutral-900/50 overflow-hidden shrink-0"
              >
                {rawMarkdown.split('\n').map((_, i) => (
                  <div key={i} className="h-7">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Raw Markdown Textarea */}
              <textarea
                ref={textareaRef}
                value={rawMarkdown}
                onChange={handlePlaintextChange}
                onScroll={handleScroll}
                onKeyDown={handleTextareaKeyDown}
                placeholder="# Type raw markdown here (supports YAML frontmatter and [[WikiLinks]])..."
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="flex-1 w-full resize-none p-4 font-mono text-[13.5px] leading-7 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none min-h-[480px]"
              />
            </div>
          </div>
        )}

        {/* Backlinks & Properties Panel */}
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

      {/* Slash Command Suggestion Popover */}
      {slashMenu.isOpen && slashMenu.coords && (
        <div
          style={{
            top: `${slashMenu.coords.top}px`,
            left: `${slashMenu.coords.left}px`,
            position: 'fixed',
          }}
          className="z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Blocks & Commands
          </div>
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-2 text-neutral-400">No matching commands</div>
          ) : (
            filteredCommands.map((item, idx) => (
              <button
                key={item.title}
                onClick={() => executeCommand(item)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  idx === slashMenu.selectedIndex
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  {getIcon(item.iconName)}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{item.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* WikiLink Auto-Complete Suggestion Popover */}
      {wikiMenu.isOpen && wikiMenu.coords && (
        <div
          style={{
            top: `${wikiMenu.coords.top}px`,
            left: `${wikiMenu.coords.left}px`,
            position: 'fixed',
          }}
          className="z-50 w-72 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Link to Note [[...]]
          </div>
          {wikiMenu.suggestions.length === 0 ? (
            <div className="px-3 py-2 text-neutral-400">No matching notes found</div>
          ) : (
            wikiMenu.suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.title + suggestion.path}
                onClick={() => executeWikiLink(suggestion)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                  idx === wikiMenu.selectedIndex
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-medium truncate text-neutral-900 dark:text-neutral-100">
                    {suggestion.title}
                  </span>
                </div>
                {suggestion.isNew && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider ml-2 shrink-0">
                    Create
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
