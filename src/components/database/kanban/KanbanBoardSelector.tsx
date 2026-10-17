'use client';

import React, { useState } from 'react';
import { Kanban, Plus, Pencil, Trash2, Layers, Flag } from 'lucide-react';
import { KanbanBoard } from '@/src/stores/slices/kanbanSlice';
import { BoardModalMode } from './KanbanBoardModals';

export interface KanbanBoardSelectorProps {
  boards: KanbanBoard[];
  activeBoard: KanbanBoard;
  onSelectBoard: (boardId: string) => void;
  onOpenModal: (mode: BoardModalMode) => void;
  onReorderBoards?: (startIndex: number, endIndex: number) => void;
}

export function KanbanBoardSelector({
  boards,
  activeBoard,
  onSelectBoard,
  onOpenModal,
  onReorderBoards,
}: KanbanBoardSelectorProps) {
  const [draggedBoardIndex, setDraggedBoardIndex] = useState<number | null>(null);
  const [dragOverBoardIndex, setDragOverBoardIndex] = useState<number | null>(null);

  const isEisenhower = activeBoard.groupKey === 'eisenhower';

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedBoardIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (draggedBoardIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBoardIndex !== index) {
      setDragOverBoardIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedBoardIndex !== null && draggedBoardIndex !== targetIndex) {
      onReorderBoards?.(draggedBoardIndex, targetIndex);
    }
    setDraggedBoardIndex(null);
    setDragOverBoardIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBoardIndex(null);
    setDragOverBoardIndex(null);
  };

  return (
    <div
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border shadow-2xs"
    >
      {/* Left: Board Selector Pills & Dropdown */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-[var(--border)] text-xs font-semibold text-[var(--foreground)]">
          <Kanban className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Boards</span>
        </div>

        <div
          className="flex items-center gap-1 flex-wrap"
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDragOverBoardIndex(null);
          }}
        >
          {boards.map((board, index) => {
            const isActive = board.id === activeBoard.id;
            const isDragging = draggedBoardIndex === index;
            const isOver = dragOverBoardIndex === index && draggedBoardIndex !== null && draggedBoardIndex !== index;

            return (
              <button
                key={board.id}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectBoard(board.id)}
                title={`Drag to reorder "${board.name}"`}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-500/10'
                } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                  isOver ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--card)]' : ''
                }`}
              >
                <span>{board.name}</span>
                <span
                  className={`text-[10px] px-1 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  {board.columns.length}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onOpenModal('create')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
          title="Create a new Kanban board"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Board</span>
        </button>
      </div>

      {/* Right: Group Key Indicator & Active Board Actions */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-500/10 text-[11px] text-neutral-400 font-medium">
          {isEisenhower ? (
            <>
              <Flag className="w-3 h-3 text-amber-500" />
              <span>Eisenhower</span>
            </>
          ) : (
            <>
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Status ({activeBoard.groupKey})</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-0.5 border-l border-[var(--border)] pl-2">
          <button
            type="button"
            onClick={() => onOpenModal('rename')}
            title="Rename active board"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-500/10 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={boards.length <= 1}
            onClick={() => onOpenModal('delete')}
            title={boards.length <= 1 ? 'Cannot delete the only board' : 'Delete active board'}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
