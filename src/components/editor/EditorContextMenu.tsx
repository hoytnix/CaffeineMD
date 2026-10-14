'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { ContextMenu, ContextMenuElement } from '@/src/components/common/ContextMenu';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { wasmSandbox } from '@/src/lib/sandbox/wasmSandbox';
import { executeSmartPaste } from '@/src/lib/markdown/smartPaste';
import {
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Code,
  Strikethrough,
  Highlighter,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  CheckSquare,
  Play,
  Table,
  Terminal,
  Quote,
  Minus,
  Download,
  Cloud,
  Calculator,
} from 'lucide-react';

interface EditorContextMenuProps {
  editor: Editor | null;
  filePath: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function EditorContextMenu({
  editor,
  filePath,
  isOpen,
  onClose,
  position,
}: EditorContextMenuProps) {
  const { openExportModal, showToast } = useWorkspaceStore();

  if (!editor || !isOpen) return null;

  const { state } = editor;
  const { from, to, empty } = state.selection;
  const isCodeBlock = editor.isActive('codeBlock');
  const selectedText = !empty ? state.doc.textBetween(from, to, ' ') : '';

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      showToast('Copied to clipboard');
    }
  };

  const handleCut = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      editor.chain().focus().deleteSelection().run();
      showToast('Cut to clipboard');
    }
  };

  const handlePaste = async () => {
    try {
      const res = await executeSmartPaste(editor);
      if (res.type !== 'empty') {
        showToast(`Pasted ${res.label}`);
      }
    } catch {
      showToast('Clipboard access denied');
    }
  };

  const handleConvertToWikiLink = () => {
    if (!selectedText) return;
    editor.chain().focus().insertContent(`[[${selectedText}]]`).run();
  };

  const handleRunMath = async () => {
    const code = selectedText.trim() || '2 + 2';
    showToast('Evaluating expression...');
    const res = await wasmSandbox.runCode('math', code);
    const resultText = res.outputs.map((o) => o.text).join(' ');
    if (resultText) {
      editor.chain().focus().insertContent(` = ${resultText}`).run();
      showToast(`Evaluated: ${resultText}`);
    }
  };

  let menuItems: ContextMenuElement[] = [];

  if (isCodeBlock) {
    // Inside Code Block Context Menu
    menuItems = [
      {
        label: 'Run in WASM Sandbox',
        icon: <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />,
        shortcut: '⇧↵',
        onClick: async () => {
          const code = editor.state.selection.$from.parent.textContent;
          showToast('Running in WASM sandbox...');
          const res = await wasmSandbox.runCode('javascript', code);
          const out = res.outputs.map((o) => o.text).join('\n');
          showToast(out ? `Result: ${out}` : `Completed in ${res.executionTimeMs}ms`);
        },
      },
      {
        label: 'Copy Code Block Content',
        icon: <Copy className="w-3.5 h-3.5" />,
        onClick: () => {
          const code = editor.state.selection.$from.parent.textContent;
          navigator.clipboard.writeText(code);
          showToast('Code copied to clipboard');
        },
      },
      { isDivider: true },
      {
        label: 'Insert Execution Output Below',
        icon: <Terminal className="w-3.5 h-3.5 text-indigo-400" />,
        onClick: async () => {
          const code = editor.state.selection.$from.parent.textContent;
          const res = await wasmSandbox.runCode('javascript', code);
          const out = res.outputs.map((o) => o.text).join('\n');
          editor.chain().focus().insertContent(`\n> Output: ${out || 'None'}\n`).run();
        },
      },
    ];
  } else if (!empty) {
    // With Text Selection Context Menu
    menuItems = [
      {
        label: 'Cut',
        icon: <Scissors className="w-3.5 h-3.5" />,
        shortcut: '⌘X',
        onClick: handleCut,
      },
      {
        label: 'Copy',
        icon: <Copy className="w-3.5 h-3.5" />,
        shortcut: '⌘C',
        onClick: handleCopy,
      },
      {
        label: 'Paste',
        icon: <Clipboard className="w-3.5 h-3.5" />,
        shortcut: '⌘V',
        onClick: handlePaste,
      },
      { isDivider: true },
      {
        label: 'Format Text',
        submenu: [
          {
            label: 'Bold',
            icon: <Bold className="w-3.5 h-3.5" />,
            shortcut: '⌘B',
            onClick: () => editor.chain().focus().toggleBold().run(),
          },
          {
            label: 'Italic',
            icon: <Italic className="w-3.5 h-3.5" />,
            shortcut: '⌘I',
            onClick: () => editor.chain().focus().toggleItalic().run(),
          },
          {
            label: 'Inline Code',
            icon: <Code className="w-3.5 h-3.5" />,
            shortcut: '⌘E',
            onClick: () => editor.chain().focus().toggleCode().run(),
          },
          {
            label: 'Strikethrough',
            icon: <Strikethrough className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleStrike().run(),
          },
          {
            label: 'Highlight',
            icon: <Highlighter className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleMark('highlight').run(),
          },
        ],
      },
      {
        label: 'Convert to [[WikiLink]]',
        icon: <Link className="w-3.5 h-3.5 text-indigo-400" />,
        onClick: handleConvertToWikiLink,
      },
      {
        label: 'Turn into Heading',
        submenu: [
          {
            label: 'Heading 1',
            icon: <Heading1 className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          },
          {
            label: 'Heading 2',
            icon: <Heading2 className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            label: 'Heading 3',
            icon: <Heading3 className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          },
          {
            label: 'Heading 4',
            icon: <Heading4 className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
          },
        ],
      },
      {
        label: 'Create Task Item',
        icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />,
        onClick: () => editor.chain().focus().toggleTaskList().run(),
      },
      { isDivider: true },
      {
        label: 'Run Expression / Math Sandbox',
        icon: <Calculator className="w-3.5 h-3.5 text-amber-400" />,
        onClick: handleRunMath,
      },
    ];
  } else {
    // Caret in Prose (No Selection) Context Menu
    menuItems = [
      {
        label: 'Paste',
        icon: <Clipboard className="w-3.5 h-3.5" />,
        shortcut: '⌘V',
        onClick: handlePaste,
      },
      { isDivider: true },
      {
        label: 'Insert Element',
        submenu: [
          {
            label: 'Table (3x3)',
            icon: <Table className="w-3.5 h-3.5" />,
            onClick: () =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          },
          {
            label: 'Code Block',
            icon: <Code className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleCodeBlock().run(),
          },
          {
            label: 'Callout Note',
            icon: <Quote className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().toggleBlockquote().run(),
          },
          {
            label: 'Divider Line',
            icon: <Minus className="w-3.5 h-3.5" />,
            onClick: () => editor.chain().focus().setHorizontalRule().run(),
          },
        ],
      },
      { isDivider: true },
      {
        label: 'Export Note to PWA / HTML',
        icon: <Download className="w-3.5 h-3.5" />,
        onClick: () => openExportModal({ targetNotePath: filePath }),
      },
      {
        label: 'Deploy Note to Netlify',
        icon: <Cloud className="w-3.5 h-3.5 text-teal-400" />,
        onClick: () => openExportModal({ targetNotePath: filePath }),
      },
    ];
  }

  return (
    <ContextMenu
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      items={menuItems}
    />
  );
}
