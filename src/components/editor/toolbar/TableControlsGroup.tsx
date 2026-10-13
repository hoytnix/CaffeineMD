'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Table as TableIcon, Columns, Rows, Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, LayoutGrid, FileSpreadsheet } from 'lucide-react';

export interface TableControlsGroupProps {
  editor: Editor;
  onActionNotice?: (msg: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function TableControlsGroup({
  editor,
  onActionNotice,
  orientation = 'horizontal',
}: TableControlsGroupProps) {
  const isTableActive = editor.isActive('table');
  const isVertical = orientation === 'vertical';

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    onActionNotice?.('Table inserted');
  };

  const handlePasteCsv = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        onActionNotice?.('Clipboard is empty');
        return;
      }
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const rows = lines.map((line) => line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, '')));
      const colsCount = Math.max(...rows.map((r) => r.length), 1);

      let tableHtml = '<table class="border-collapse table-auto w-full"><tbody>';
      rows.forEach((row, rIdx) => {
        tableHtml += '<tr>';
        for (let c = 0; c < colsCount; c++) {
          const val = row[c] || '';
          const tag = rIdx === 0 ? 'th' : 'td';
          tableHtml += `<${tag}><p>${val}</p></${tag}>`;
        }
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';

      editor.chain().focus().insertContent(tableHtml).run();
      onActionNotice?.(`Inserted ${rows.length}x${colsCount} table from clipboard`);
    } catch {
      onActionNotice?.('Unable to read clipboard for CSV');
    }
  };

  return (
    <div className={`flex ${isVertical ? 'flex-col' : 'items-center'} gap-0.5 shrink-0`}>
      <button
        type="button"
        onClick={handleInsertTable}
        title="Insert Table (3x3)"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          isTableActive
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <TableIcon className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
      </button>

      {isTableActive && (
        <>
          {/* Column Actions */}
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            disabled={!editor.can().addColumnBefore()}
            title="Insert Column Left"
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center"
          >
            <Columns className="w-3.5 h-3.5" />
            <ArrowLeft className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!editor.can().addColumnAfter()}
            title="Insert Column Right"
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center"
          >
            <Columns className="w-3.5 h-3.5" />
            <ArrowRight className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
            title="Delete Column"
            className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Row Actions */}
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            disabled={!editor.can().addRowBefore()}
            title="Insert Row Above"
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center"
          >
            <Rows className="w-3.5 h-3.5" />
            <ArrowUp className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!editor.can().addRowAfter()}
            title="Insert Row Below"
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center"
          >
            <Rows className="w-3.5 h-3.5" />
            <ArrowDown className="w-2.5 h-2.5 -ml-1 text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
            title="Delete Row"
            className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          </button>

          {/* Header Row Toggle */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="Toggle Header Row"
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Delete Table */}
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              onActionNotice?.('Table deleted');
            }}
            title="Delete Table"
            className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </button>
        </>
      )}

      {/* Paste CSV as Table */}
      <button
        type="button"
        onClick={handlePasteCsv}
        title="Paste Clipboard CSV/TSV as Table"
        className="p-1 px-1.5 rounded-lg text-neutral-400 hover:text-[var(--accent)] hover:bg-[var(--border)]/60 cursor-pointer transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
