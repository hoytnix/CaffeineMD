'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Copy,
  Check,
  Heading,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  SquareCode,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  GripVertical,
  Outdent,
  Indent,
  Columns,
  Rows,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { editorHtmlToMarkdown } from '@/src/lib/markdown/serializer';

interface ToolbarButtonDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor, onActionNotice?: (msg: string) => void) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  isVisible?: (editor: Editor) => boolean;
}

const DEFAULT_BUTTON_ORDER = [
  'copy-all',
  'heading',
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'code-block',
  'bullet-list',
  'ordered-list',
  'task-list',
  'outdent',
  'indent',
  'blockquote',
  'link',
  'image',
  'table',
  'table-add-col',
  'table-del-col',
  'table-add-row',
  'table-del-row',
  'hr',
  'undo',
  'redo',
];

const HEADING_LEVELS = [
  { level: 1 as const, label: 'Heading 1', tag: 'H1' },
  { level: 2 as const, label: 'Heading 2', tag: 'H2' },
  { level: 3 as const, label: 'Heading 3', tag: 'H3' },
  { level: 4 as const, label: 'Heading 4', tag: 'H4' },
  { level: 5 as const, label: 'Heading 5', tag: 'H5' },
  { level: 6 as const, label: 'Heading 6', tag: 'H6' },
];

const BUTTON_DEFINITIONS: Record<string, ToolbarButtonDef> = {
  'copy-all': {
    id: 'copy-all',
    label: 'Copy All to Clipboard',
    icon: Copy,
    action: (editor, onActionNotice) => {
      try {
        const html = editor.getHTML();
        const markdown = editorHtmlToMarkdown(html);
        navigator.clipboard.writeText(markdown || editor.getText());
        onActionNotice?.('Copied note to clipboard');
      } catch (err) {
        console.warn('Failed to copy note:', err);
      }
    },
  },
  heading: {
    id: 'heading',
    label: 'Headings',
    icon: Heading,
    action: () => {
      // Toggled via isHeaderMenuOpen state
    },
    isActive: (editor) => editor.isActive('heading'),
  },
  bold: {
    id: 'bold',
    label: 'Bold (⌘B)',
    icon: Bold,
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive('bold'),
  },
  italic: {
    id: 'italic',
    label: 'Italic (⌘I)',
    icon: Italic,
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive('italic'),
  },
  underline: {
    id: 'underline',
    label: 'Underline (⌘U)',
    icon: UnderlineIcon,
    action: (editor) => {
      if ((editor.commands as any).toggleUnderline) {
        (editor.chain().focus() as any).toggleUnderline().run();
      }
    },
    isActive: (editor) => editor.isActive('underline'),
  },
  strike: {
    id: 'strike',
    label: 'Strikethrough',
    icon: Strikethrough,
    action: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive('strike'),
  },
  code: {
    id: 'code',
    label: 'Inline Code',
    icon: Code,
    action: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive('code'),
  },
  'code-block': {
    id: 'code-block',
    label: 'Code Block',
    icon: SquareCode,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  'bullet-list': {
    id: 'bullet-list',
    label: 'Bullet List',
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  'ordered-list': {
    id: 'ordered-list',
    label: 'Numbered List',
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  'task-list': {
    id: 'task-list',
    label: 'Task Checklist',
    icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
    isActive: (editor) => editor.isActive('taskList'),
  },
  outdent: {
    id: 'outdent',
    label: 'Decrease Indent (Outdent)',
    icon: Outdent,
    action: (editor) => {
      const liftedList = editor.chain().focus().liftListItem('listItem').run();
      if (!liftedList) {
        editor.chain().focus().liftListItem('taskItem').run();
      }
    },
    isDisabled: (editor) =>
      !editor.can().liftListItem('listItem') && !editor.can().liftListItem('taskItem'),
  },
  indent: {
    id: 'indent',
    label: 'Increase Indent (Indent)',
    icon: Indent,
    action: (editor) => {
      const sinkList = editor.chain().focus().sinkListItem('listItem').run();
      if (!sinkList) {
        editor.chain().focus().sinkListItem('taskItem').run();
      }
    },
    isDisabled: (editor) =>
      !editor.can().sinkListItem('listItem') && !editor.can().sinkListItem('taskItem'),
  },
  blockquote: {
    id: 'blockquote',
    label: 'Blockquote',
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
  link: {
    id: 'link',
    label: 'Insert Link',
    icon: LinkIcon,
    action: (editor) => {
      const url = window.prompt('Enter link URL (or note title for WikiLink):');
      if (url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          editor.chain().focus().setLink?.({ href: url }).run();
        } else {
          editor.chain().focus().insertContent(`[[${url}]]`).run();
        }
      }
    },
    isActive: (editor) => editor.isActive('link'),
  },
  image: {
    id: 'image',
    label: 'Insert Image URL',
    icon: ImageIcon,
    action: (editor) => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage?.({ src: url }).run();
      }
    },
  },
  table: {
    id: 'table',
    label: 'Insert Table',
    icon: TableIcon,
    action: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
    isActive: (editor) => editor.isActive('table'),
  },
  'table-add-col': {
    id: 'table-add-col',
    label: 'Add Column After',
    icon: Columns,
    action: (editor) => editor.chain().focus().addColumnAfter().run(),
    isDisabled: (editor) => !editor.can().addColumnAfter(),
    isVisible: (editor) => editor.isActive('table'),
  },
  'table-del-col': {
    id: 'table-del-col',
    label: 'Delete Column',
    icon: Trash2,
    action: (editor) => editor.chain().focus().deleteColumn().run(),
    isDisabled: (editor) => !editor.can().deleteColumn(),
    isVisible: (editor) => editor.isActive('table'),
  },
  'table-add-row': {
    id: 'table-add-row',
    label: 'Add Row After',
    icon: Rows,
    action: (editor) => editor.chain().focus().addRowAfter().run(),
    isDisabled: (editor) => !editor.can().addRowAfter(),
    isVisible: (editor) => editor.isActive('table'),
  },
  'table-del-row': {
    id: 'table-del-row',
    label: 'Delete Row',
    icon: Minus,
    action: (editor) => editor.chain().focus().deleteRow().run(),
    isDisabled: (editor) => !editor.can().deleteRow(),
    isVisible: (editor) => editor.isActive('table'),
  },
  hr: {
    id: 'hr',
    label: 'Horizontal Divider',
    icon: Minus,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  undo: {
    id: 'undo',
    label: 'Undo (⌘Z)',
    icon: Undo,
    action: (editor) => editor.chain().focus().undo().run(),
  },
  redo: {
    id: 'redo',
    label: 'Redo (⌘⇧Z)',
    icon: Redo,
    action: (editor) => editor.chain().focus().redo().run(),
  },
};

interface EditorBottomToolbarProps {
  editor: Editor | null;
}

export function EditorBottomToolbar({ editor }: EditorBottomToolbarProps) {
  const { showToast } = useWorkspaceStore();
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Outside click listener for heading popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    if (isHeaderMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isHeaderMenuOpen]);

  const [buttonOrder, setButtonOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kite-editor-toolbar-order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure any new buttons are appended and missing ones removed
            const valid = parsed.filter((id) => BUTTON_DEFINITIONS[id]);
            const missing = DEFAULT_BUTTON_ORDER.filter((id) => !valid.includes(id));
            return [...valid, ...missing];
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_BUTTON_ORDER;
  });

  const draggedItemRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Mouse drag-to-scroll support
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedDistRef = useRef(false);

  const saveOrder = (newOrder: string[]) => {
    setButtonOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kite-editor-toolbar-order', JSON.stringify(newOrder));
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', buttonOrder[index]);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    draggedItemRef.current = null;
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedItemRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const updated = [...buttonOrder];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);

    draggedItemRef.current = null;
    setDragOverIndex(null);
    saveOrder(updated);
    showToast('Toolbar reordered');
  };

  // Horizontal pan/drag listeners on container
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0 || !containerRef.current) return;
    // Don't initiate scroll if user is starting HTML5 drag on grip handle
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    hasDraggedDistRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - mouseStartXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedDistRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      // Convert vertical mouse scroll into smooth horizontal scroll
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!editor) return null;

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="Editor Formatting Toolbar"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="sticky bottom-6 z-30 mx-auto w-[calc(100%-3rem)] max-w-2xl overflow-x-auto scrollbar-none no-scrollbar py-1 px-3 rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex items-center gap-1.5 select-none transition-all cursor-grab active:cursor-grabbing shrink-0"
    >
      {buttonOrder.map((btnId, idx) => {
        const def = BUTTON_DEFINITIONS[btnId];
        if (!def) return null;

        const isVisible = def.isVisible ? def.isVisible(editor) : true;
        if (!isVisible) return null;

        const isCopyBtn = btnId === 'copy-all';
        const isHeadingBtn = btnId === 'heading';
        const IconComponent = isCopyBtn && copiedRecently ? Check : def.icon;
        const active = isHeadingBtn
          ? editor.isActive('heading')
          : def.isActive
          ? def.isActive(editor)
          : false;
        const disabled = def.isDisabled ? def.isDisabled(editor) : false;
        const isDragOver = dragOverIndex === idx;

        if (isHeadingBtn) {
          return (
            <div
              key={btnId}
              ref={headerMenuRef}
              draggable={!disabled && !isHeaderMenuOpen}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, idx)}
              className={`relative flex items-center shrink-0 rounded-lg transition-all ${
                isDragOver ? 'scale-110 ring-2 ring-[var(--accent)]' : ''
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  if (hasDraggedDistRef.current) {
                    e.stopPropagation();
                    return;
                  }
                  setIsHeaderMenuOpen((prev) => !prev);
                }}
                title="Headings (Drag icon to reorder, drag bar to scroll)"
                aria-expanded={isHeaderMenuOpen}
                aria-haspopup="true"
                className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
                  active || isHeaderMenuOpen
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
                }`}
              >
                <Heading className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
                <ChevronDown className="w-2.5 h-2.5 opacity-70 pointer-events-none" />
              </button>

              {/* Headings H1-H6 Popover Menu */}
              {isHeaderMenuOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    Heading Levels
                  </div>

                  {HEADING_LEVELS.map(({ level, label, tag }) => {
                    const isLevelActive = editor.isActive('heading', { level });
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().toggleHeading({ level }).run();
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
                          isLevelActive
                            ? 'bg-[var(--accent)] text-white font-semibold'
                            : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                            isLevelActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
                          }`}
                        >
                          {tag}
                        </span>
                      </button>
                    );
                  })}

                  <div className="my-1 border-t border-[var(--border)]" />

                  {/* Normal Text / Paragraph option */}
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setParagraph().run();
                      setIsHeaderMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
                      editor.isActive('paragraph')
                        ? 'bg-[var(--accent)] text-white font-semibold'
                        : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
                    }`}
                  >
                    <span>Normal Text</span>
                    <span
                      className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                        editor.isActive('paragraph')
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
                      }`}
                    >
                      P
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={btnId}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, idx)}
            className={`relative flex items-center shrink-0 rounded-lg transition-all ${
              isDragOver ? 'scale-110 ring-2 ring-[var(--accent)]' : ''
            }`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                // If user was dragging to pan/scroll or button disabled, suppress button click
                if (disabled || hasDraggedDistRef.current) {
                  e.stopPropagation();
                  return;
                }
                def.action(editor, (msg) => {
                  showToast(msg);
                  if (isCopyBtn) {
                    setCopiedRecently(true);
                    setTimeout(() => setCopiedRecently(false), 2000);
                  }
                });
              }}
              title={`${def.label} (Drag icon to reorder, drag bar to scroll)`}
              className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] disabled:opacity-30 disabled:cursor-not-allowed ${
                active
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : isCopyBtn && copiedRecently
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
