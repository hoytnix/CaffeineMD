'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Table as TableIcon, Columns, Rows, Plus, Trash2, Minus } from 'lucide-react';

export interface TableControlsGroupProps {
  editor: Editor;
  onActionNotice?: (msg: string) => void;
}

export function TableControlsGroup({
  editor,
  onActionNotice,
}: TableControlsGroupProps) {
  const isTableActive = editor.isActive('table');

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    onActionNotice?.('Table inserted');
  };

  const handleAddColumn = () => {
    if (editor.can().addColumnAfter()) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const handleDeleteColumn = () => {
    if (editor.can().deleteColumn()) {
      editor.chain().focus().deleteColumn().run();
    }
  };

  const handleAddRow = () => {
    if (editor.can().addRowAfter()) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  const handleDeleteRow = () => {
    if (editor.can().deleteRow()) {
      editor.chain().focus().deleteRow().run();
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={handleInsertTable}
        title="Insert Table (3x3)"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          isTableActive
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <TableIcon className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      {isTableActive && (
        <>
          <button
            type="button"
            disabled={!editor.can().addColumnAfter()}
            onClick={handleAddColumn}
            title="Add Column After"
            className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Columns className="w-3.5 h-3.5 shrink-0 stroke-[2] pointer-events-none text-indigo-400" />
            <Plus className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            disabled={!editor.can().deleteColumn()}
            onClick={handleDeleteColumn}
            title="Delete Column"
            className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0 stroke-[2] pointer-events-none" />
          </button>

          <button
            type="button"
            disabled={!editor.can().addRowAfter()}
            onClick={handleAddRow}
            title="Add Row After"
            className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Rows className="w-3.5 h-3.5 shrink-0 stroke-[2] pointer-events-none text-indigo-400" />
            <Plus className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            disabled={!editor.can().deleteRow()}
            onClick={handleDeleteRow}
            title="Delete Row"
            className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5 shrink-0 stroke-[2] pointer-events-none" />
          </button>
        </>
      )}
    </div>
  );
}
