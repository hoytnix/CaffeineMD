'use client';

import React, { useState } from 'react';
import { ModalShell } from '@/src/components/common/ModalShell';
import { KanbanBoard } from '@/src/stores/slices/kanbanSlice';

export type BoardModalMode = 'create' | 'rename' | 'delete' | null;

export interface KanbanBoardModalsProps {
  mode: BoardModalMode;
  activeBoard: KanbanBoard;
  onClose: () => void;
  onCreateBoard: (name: string, groupKey: string, columns: string[]) => void;
  onRenameBoard: (id: string, newName: string) => void;
  onDeleteBoard: (id: string) => void;
}

const DEFAULT_STATUS_STR = 'Draft, In Progress, Completed, Archived';
const DEFAULT_EISENHOWER_STR =
  'Urgent & Immediate, Urgent & Not Immediate, Not Urgent & Immediate, Not Urgent & Not Immediate';

export function KanbanBoardModals({
  mode,
  activeBoard,
  onClose,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
}: KanbanBoardModalsProps) {
  const [createName, setCreateName] = useState('');
  const [groupKey, setGroupKey] = useState<string>('status');
  const [columnsInput, setColumnsInput] = useState(DEFAULT_STATUS_STR);
  const [renameDraft, setRenameDraft] = useState<string | null>(null);

  const currentRenameValue = renameDraft !== null ? renameDraft : activeBoard.name;

  const handleClose = () => {
    setCreateName('');
    setGroupKey('status');
    setColumnsInput(DEFAULT_STATUS_STR);
    setRenameDraft(null);
    onClose();
  };

  const handleGroupKeyChange = (nextKey: string) => {
    setGroupKey(nextKey);
    setColumnsInput(nextKey === 'eisenhower' ? DEFAULT_EISENHOWER_STR : DEFAULT_STATUS_STR);
  };

  const handleSubmitCreate = () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    const cols = columnsInput.split(',').map((c) => c.trim()).filter(Boolean);
    onCreateBoard(trimmed, groupKey, cols);
    handleClose();
  };

  const handleSubmitRename = () => {
    const trimmed = currentRenameValue.trim();
    if (!trimmed) return;
    onRenameBoard(activeBoard.id, trimmed);
    handleClose();
  };

  return (
    <>
      <ModalShell
        isOpen={mode === 'create'}
        onClose={handleClose}
        title="Create Kanban Board"
        description="Configure a new board view and its initial column lanes."
        size="sm"
        footer={
          <>
            <button type="button" onClick={handleClose} className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-[var(--foreground)] cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSubmitCreate} disabled={!createName.trim()} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer">Create Board</button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Board Name</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g., Not ToDO, Sprint Backlog..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCreate()}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Group By Property</label>
            <select
              value={groupKey}
              onChange={(e) => handleGroupKeyChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] outline-none focus:border-indigo-500"
            >
              <option value="status">Status (frontmatter.status)</option>
              <option value="eisenhower">Eisenhower Matrix (frontmatter.eisenhower)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Initial Columns (comma-separated)</label>
            <input
              type="text"
              value={columnsInput}
              onChange={(e) => setColumnsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCreate()}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={mode === 'rename'}
        onClose={handleClose}
        title="Rename Kanban Board"
        size="sm"
        footer={
          <>
            <button type="button" onClick={handleClose} className="px-3 py-1.5 text-xs text-neutral-400 cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSubmitRename} disabled={!currentRenameValue.trim()} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer">Save Name</button>
          </>
        }
      >
        <input
          type="text"
          value={currentRenameValue}
          onChange={(e) => setRenameDraft(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitRename()}
          className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-xs outline-none focus:border-indigo-500"
        />
      </ModalShell>

      <ModalShell
        isOpen={mode === 'delete'}
        onClose={handleClose}
        title="Delete Kanban Board"
        description={`Are you sure you want to delete "${activeBoard.name}"?`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={handleClose} className="px-3 py-1.5 text-xs text-neutral-400 cursor-pointer">Cancel</button>
            <button type="button" onClick={() => { onDeleteBoard(activeBoard.id); handleClose(); }} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete Board</button>
          </>
        }
      >
        <p className="text-xs text-neutral-400">
          This removes the board layout configuration. Underlying Markdown notes in your vault will not be deleted.
        </p>
      </ModalShell>
    </>
  );
}
