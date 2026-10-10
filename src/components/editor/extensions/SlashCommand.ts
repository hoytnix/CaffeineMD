import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

export const SlashCommandPluginKey = new PluginKey('slashCommandSuggestion');

export interface CommandItem {
  title: string;
  description: string;
  category: string;
  iconName: string;
  command: ({ editor, range }: { editor: any; range: any }) => void;
}

export const getCommandItems = (): CommandItem[] => [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    category: 'Basic blocks',
    iconName: 'Heading1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    category: 'Basic blocks',
    iconName: 'Heading2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small subsection heading',
    category: 'Basic blocks',
    iconName: 'Heading3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Simple unordered list',
    category: 'Basic blocks',
    iconName: 'List',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered sequential list',
    category: 'Basic blocks',
    iconName: 'ListOrdered',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Interactive checkbox to-do list',
    category: 'Basic blocks',
    iconName: 'CheckSquare',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Callout',
    description: 'Highlighted callout block',
    category: 'Basic blocks',
    iconName: 'Info',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Monospace code block with syntax formatting',
    category: 'Advanced',
    iconName: 'Code',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Table',
    description: 'Structured 3x3 table grid',
    category: 'Advanced',
    iconName: 'Table',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: 'WikiLink',
    description: 'Create bidirectional link to another note [[...]]',
    category: 'Links',
    iconName: 'Link2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent('[[').run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal content separator',
    category: 'Basic blocks',
    iconName: 'Minus',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: SlashCommandPluginKey,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: this.options.suggestion.pluginKey || SlashCommandPluginKey,
      }),
    ];
  },
});
