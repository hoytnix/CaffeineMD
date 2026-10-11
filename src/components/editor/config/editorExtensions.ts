import { AnyExtension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockView } from '../extensions/CodeBlockView';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { createLowlight, all } from 'lowlight';
import { SlashCommands } from '../extensions/SlashCommand';
import { WikiLinkNode } from '../extensions/WikiLink';

const lowlight = createLowlight(all);

export interface EditorExtensionCallbacks {
  onWikiMenuStart: (props: any) => void;
  onWikiMenuUpdate: (props: any) => void;
  onWikiMenuKeyDown: (props: any) => boolean;
  onWikiMenuExit: () => void;
  onSlashMenuStart: (props: any) => void;
  onSlashMenuUpdate: (props: any) => void;
  onSlashMenuKeyDown: (props: any) => boolean;
  onSlashMenuExit: () => void;
}

export function getEditorExtensions(callbacks: EditorExtensionCallbacks): AnyExtension[] {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      paragraph: {},
      hardBreak: { keepMarks: true },
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
      },
    }).configure({
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
          onStart: callbacks.onWikiMenuStart,
          onUpdate: callbacks.onWikiMenuUpdate,
          onKeyDown: callbacks.onWikiMenuKeyDown,
          onExit: callbacks.onWikiMenuExit,
        }),
      },
    }),
    SlashCommands.configure({
      suggestion: {
        render: () => ({
          onStart: callbacks.onSlashMenuStart,
          onUpdate: callbacks.onSlashMenuUpdate,
          onKeyDown: callbacks.onSlashMenuKeyDown,
          onExit: callbacks.onSlashMenuExit,
        }),
      },
    }),
  ];
}
