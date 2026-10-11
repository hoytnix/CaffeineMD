'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  List,
  ListOrdered,
  CheckSquare,
  Outdent,
  Indent,
} from 'lucide-react';

export interface ListFormattingGroupProps {
  editor: Editor;
}

export function ListFormattingGroup({ editor }: ListFormattingGroupProps) {
  const isBulletActive = editor.isActive('bulletList');
  const isOrderedActive = editor.isActive('orderedList');
  const isTaskActive = editor.isActive('taskList');

  const canOutdent =
    editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem');
  const canIndent =
    editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem');

  const handleToggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const handleToggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const handleToggleTaskList = () => {
    editor.chain().focus().toggleTaskList().run();
  };

  const handleOutdent = () => {
    const liftedList = editor.chain().focus().liftListItem('listItem').run();
    if (!liftedList) {
      editor.chain().focus().liftListItem('taskItem').run();
    }
  };

  const handleIndent = () => {
    const sinkList = editor.chain().focus().sinkListItem('listItem').run();
    if (!sinkList) {
      editor.chain().focus().sinkListItem('taskItem').run();
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={handleToggleBulletList}
        title="Bullet List"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          isBulletActive
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <List className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      <button
        type="button"
        onClick={handleToggleOrderedList}
        title="Numbered List"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          isOrderedActive
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <ListOrdered className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      <button
        type="button"
        onClick={handleToggleTaskList}
        title="Task Checklist"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          isTaskActive
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <CheckSquare className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      <button
        type="button"
        disabled={!canOutdent}
        onClick={handleOutdent}
        title="Decrease Indent (Outdent)"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Outdent className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      <button
        type="button"
        disabled={!canIndent}
        onClick={handleIndent}
        title="Increase Indent (Indent)"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Indent className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>
    </div>
  );
}
