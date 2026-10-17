'use client';

import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

export interface KanbanAddColumnCardProps {
  onAddColumn: (columnName: string) => void;
}

export function KanbanAddColumnCard({ onAddColumn }: KanbanAddColumnCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [columnName, setColumnName] = useState('');

  const handleSubmit = () => {
    const trimmed = columnName.trim();
    if (!trimmed) return;
    onAddColumn(trimmed);
    setColumnName('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="w-72 shrink-0 rounded-xl border border-dashed border-[var(--border)] hover:border-indigo-500/60 transition-colors p-3 flex items-center justify-center gap-1.5 min-h-[140px] text-xs font-medium text-neutral-400 hover:text-[var(--foreground)] cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ Add Column</span>
      </button>
    );
  }

  return (
    <div
      style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
      className="w-72 shrink-0 rounded-xl border p-3 shadow-xs flex flex-col gap-2.5"
    >
      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
        New Column Lane
      </span>
      <input
        type="text"
        value={columnName}
        onChange={(e) => setColumnName(e.target.value)}
        placeholder="e.g., Not ToDO, Blocked..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setIsAdding(false);
            setColumnName('');
          }
        }}
        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] outline-none focus:border-indigo-500"
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => {
            setIsAdding(false);
            setColumnName('');
          }}
          className="px-2.5 py-1 rounded-md text-xs text-neutral-400 hover:text-[var(--foreground)] flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Add Lane</span>
        </button>
      </div>
    </div>
  );
}
