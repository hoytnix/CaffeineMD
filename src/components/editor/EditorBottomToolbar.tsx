'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Copy,
  Check,
  Heading1,
  Heading2,
  Heading3,
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
} from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { editorHtmlToMarkdown } from '@/src/lib/markdown/serializer';

interface ToolbarButtonDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor, onActionNotice?: (msg: string) => void) => void;
  isActive?: (editor: Editor) => boolean;
}

const DEFAULT_BUTTON_ORDER = [
  'copy-all',
  'h1',
  'h2',
  'h3',
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'code-block',
  'bullet-list',
  'ordered-list',
  'task-list',
  'blockquote',
  'link',
  'image',
  'table',
  'hr',
  'undo',
  'redo',
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
  h1: {
    id: 'h1',
    label: 'Heading 1',
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
  },
  h2: {
    id: 'h2',
    label: 'Heading 2',
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
  },
  h3: {
    id: 'h3',
    label: 'Heading 3',
    icon: Heading3,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
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

  const saveOrder = (newOrder: string[]) => {
    setButtonOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kite-editor-toolbar-order', JSON.stringify(newOrder));
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
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
    const [moved] = updated.splice(dragIndex, liquidIndex(dragIndex));
    updated.splice(dropIndex, 0, moved);

    draggedItemRef.current = null;
    setDragOverIndex(null);
    saveOrder(updated);
    showToast('Toolbar reordered');
  };

  function liquidIndex(idx: number) {
    return 1;
  }

  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Editor Formatting Toolbar"
      className="sticky bottom-4 z-30 mx-auto w-fit max-w-[92vw] overflow-x-auto scrollbar-none py-1 px-2 rounded-2xl bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] shadow-xl flex items-center gap-1 select-none transition-all"
    >
      {buttonOrder.map((btnId, idx) => {
        const def = BUTTON_DEFINITIONS[btnId];
        if (!def) return null;

        const isCopyBtn = btnId === 'copy-all';
        const IconComponent = isCopyBtn && copiedRecently ? Check : def.icon;
        const active = def.isActive ? def.isActive(editor) : false;
        const isDragOver = dragOverIndex === idx;

        return (
          <div
            key={btnId}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, idx)}
            className={`relative flex items-center rounded-lg transition-all cursor-grab active:cursor-grabbing ${
              isDragOver ? 'scale-110 ring-2 ring-[var(--accent)]' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => {
                def.action(editor, (msg) => {
                  showToast(msg);
                  if (isCopyBtn) {
                    setCopiedRecently(true);
                    setTimeout(() => setCopiedRecently(false), 2000);
                  }
                });
              }}
              title={`${def.label} (Drag to reorder)`}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${
                active
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : isCopyBtn && copiedRecently
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40'
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
