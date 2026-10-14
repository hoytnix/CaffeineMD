'use client';

import React from 'react';
import { ContextMenu, ContextMenuElement } from '@/src/components/common/ContextMenu';
import { Scissors, Copy, Clipboard, Bold, Italic, Code, Link, Calculator, Download } from 'lucide-react';
import { wasmSandbox } from '@/src/lib/sandbox/wasmSandbox';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export interface PlaintextSelectionInfo {
  start: number;
  end: number;
  text: string;
}

interface PlaintextContextMenuProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  rawMarkdown: string;
  onMarkdownChange: (val: string) => void;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  selection: PlaintextSelectionInfo | null;
}

export function PlaintextContextMenu({
  textareaRef,
  rawMarkdown,
  onMarkdownChange,
  isOpen,
  onClose,
  position,
  selection,
}: PlaintextContextMenuProps) {
  if (!isOpen) return null;

  const start = selection?.start ?? 0;
  const end = selection?.end ?? 0;
  const selectedText = selection?.text ?? '';
  const hasSelection = selectedText.length > 0;

  const replaceSelection = (replacement: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const before = rawMarkdown.substring(0, start);
    const after = rawMarkdown.substring(end);
    onMarkdownChange(before + replacement + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleCopy = () => {
    if (selectedText) navigator.clipboard.writeText(selectedText);
  };

  const handleCut = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      replaceSelection('');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) replaceSelection(text);
    } catch {}
  };

  const items: ContextMenuElement[] = [
    { label: 'Cut', icon: <Scissors className="w-3.5 h-3.5" />, shortcut: '⌘X', disabled: !hasSelection, onClick: handleCut },
    { label: 'Copy', icon: <Copy className="w-3.5 h-3.5" />, shortcut: '⌘C', disabled: !hasSelection, onClick: handleCopy },
    { label: 'Paste', icon: <Clipboard className="w-3.5 h-3.5" />, shortcut: '⌘V', onClick: handlePaste },
    { isDivider: true },
    {
      label: 'Format Markdown',
      icon: <Code className="w-3.5 h-3.5" />,
      disabled: !hasSelection,
      submenu: [
        { label: 'Bold', icon: <Bold className="w-3.5 h-3.5" />, shortcut: '⌘B', onClick: () => replaceSelection(`**${selectedText}**`) },
        { label: 'Italic', icon: <Italic className="w-3.5 h-3.5" />, shortcut: '⌘I', onClick: () => replaceSelection(`*${selectedText}*`) },
        { label: 'Inline Code', icon: <Code className="w-3.5 h-3.5" />, shortcut: '⌘E', onClick: () => replaceSelection(`\`${selectedText}\``) },
        { label: 'Code Block', icon: <Code className="w-3.5 h-3.5" />, onClick: () => replaceSelection(`\n\`\`\`\n${selectedText}\n\`\`\`\n`) },
      ],
    },
    {
      label: 'Convert to [[WikiLink]]',
      icon: <Link className="w-3.5 h-3.5 text-indigo-400" />,
      disabled: !hasSelection,
      onClick: () => replaceSelection(`[[${selectedText}]]`),
    },
    {
      label: 'Evaluate Math Expression',
      icon: <Calculator className="w-3.5 h-3.5 text-emerald-400" />,
      disabled: !hasSelection,
      onClick: async () => {
        const res = await wasmSandbox.runCode('math', selectedText.trim());
        const resultText = res.outputs.map((o) => o.text).join(' ');
        if (resultText) {
          replaceSelection(`${selectedText} = ${resultText}`);
        }
      },
    },
    { isDivider: true },
    {
      label: 'Export Document',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: () => useWorkspaceStore.getState().openExportModal({}),
    },
  ];

  return (
    <ContextMenu
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      items={items}
    />
  );
}
