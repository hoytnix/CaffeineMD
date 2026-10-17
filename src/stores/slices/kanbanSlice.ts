import { storageRegistry, STORAGE_KEYS } from '../../lib/config/storageRegistry';

export interface KanbanBoard {
  id: string;
  name: string;
  groupKey: 'status' | 'eisenhower' | string;
  columns: string[];
  folderFilter?: string;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_KANBAN_BOARDS: KanbanBoard[] = [
  {
    id: 'default-status',
    name: 'Task Status',
    groupKey: 'status',
    columns: ['Draft', 'In Progress', 'Completed', 'Archived'],
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'default-eisenhower',
    name: 'Eisenhower Matrix',
    groupKey: 'eisenhower',
    columns: [
      'Urgent & Immediate',
      'Urgent & Not Immediate',
      'Not Urgent & Immediate',
      'Not Urgent & Not Immediate',
    ],
    createdAt: 2,
    updatedAt: 2,
  },
];

export interface KanbanSlice {
  kanbanBoards: KanbanBoard[];
  activeBoardId: string;
  setActiveBoardId: (boardId: string) => void;
  createKanbanBoard: (
    name: string,
    groupKey?: string,
    columns?: string[],
    folderFilter?: string
  ) => KanbanBoard;
  updateKanbanBoard: (id: string, updates: Partial<Omit<KanbanBoard, 'id' | 'createdAt'>>) => void;
  renameKanbanBoard: (id: string, name: string) => void;
  deleteKanbanBoard: (id: string) => void;
  addColumnToBoard: (boardId: string, column: string) => void;
  renameColumnInBoard: (boardId: string, oldCol: string, newCol: string) => void;
  deleteColumnFromBoard: (boardId: string, column: string) => void;
}

type SliceSetter = (partial: Partial<KanbanSlice> | ((state: KanbanSlice) => Partial<KanbanSlice>)) => void;
type SliceGetter = () => KanbanSlice;

function loadInitialBoards(): KanbanBoard[] {
  const stored = storageRegistry.getJson<KanbanBoard[]>(STORAGE_KEYS.KANBAN_BOARDS, DEFAULT_KANBAN_BOARDS);
  return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_KANBAN_BOARDS;
}

function persistBoards(boards: KanbanBoard[]): void {
  storageRegistry.setItem(STORAGE_KEYS.KANBAN_BOARDS, JSON.stringify(boards));
}

export const createKanbanSlice = (set: SliceSetter, get: SliceGetter): KanbanSlice => ({
  kanbanBoards: loadInitialBoards(),
  activeBoardId: storageRegistry.getItem(STORAGE_KEYS.ACTIVE_KANBAN_BOARD_ID, 'default-status') || 'default-status',

  setActiveBoardId: (boardId: string) => {
    storageRegistry.setItem(STORAGE_KEYS.ACTIVE_KANBAN_BOARD_ID, boardId);
    set({ activeBoardId: boardId });
  },

  createKanbanBoard: (name: string, groupKey = 'status', columns?: string[], folderFilter?: string): KanbanBoard => {
    const cleanName = name.trim() || 'Untitled Board';
    const defaultCols =
      groupKey === 'eisenhower'
        ? DEFAULT_KANBAN_BOARDS[1].columns
        : DEFAULT_KANBAN_BOARDS[0].columns;
    const resolvedColumns =
      columns && columns.length > 0
        ? Array.from(new Set(columns.map((c) => c.trim()).filter(Boolean)))
        : defaultCols;

    const now = Date.now();
    const newBoard: KanbanBoard = {
      id: `board-${now}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      groupKey,
      columns: resolvedColumns,
      ...(folderFilter ? { folderFilter } : {}),
      createdAt: now,
      updatedAt: now,
    };

    const nextBoards = [...get().kanbanBoards, newBoard];
    persistBoards(nextBoards);
    storageRegistry.setItem(STORAGE_KEYS.ACTIVE_KANBAN_BOARD_ID, newBoard.id);
    set({ kanbanBoards: nextBoards, activeBoardId: newBoard.id });
    return newBoard;
  },

  updateKanbanBoard: (id, updates) => {
    const nextBoards = get().kanbanBoards.map((board) =>
      board.id === id ? { ...board, ...updates, updatedAt: Date.now() } : board
    );
    persistBoards(nextBoards);
    set({ kanbanBoards: nextBoards });
  },

  renameKanbanBoard: (id, name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    get().updateKanbanBoard(id, { name: cleanName });
  },

  deleteKanbanBoard: (id) => {
    const currentBoards = get().kanbanBoards;
    if (currentBoards.length <= 1) return;
    const remaining = currentBoards.filter((b) => b.id !== id);
    const nextBoards = remaining.length > 0 ? remaining : DEFAULT_KANBAN_BOARDS;
    const currentActive = get().activeBoardId;
    const nextActiveId =
      currentActive === id || !nextBoards.some((b) => b.id === currentActive)
        ? nextBoards[0].id
        : currentActive;

    persistBoards(nextBoards);
    storageRegistry.setItem(STORAGE_KEYS.ACTIVE_KANBAN_BOARD_ID, nextActiveId);
    set({ kanbanBoards: nextBoards, activeBoardId: nextActiveId });
  },

  addColumnToBoard: (boardId, column) => {
    const cleanCol = column.trim();
    if (!cleanCol) return;
    const nextBoards = get().kanbanBoards.map((board) => {
      if (board.id !== boardId) return board;
      if (board.columns.some((c) => c.toLowerCase() === cleanCol.toLowerCase())) return board;
      return { ...board, columns: [...board.columns, cleanCol], updatedAt: Date.now() };
    });
    persistBoards(nextBoards);
    set({ kanbanBoards: nextBoards });
  },

  renameColumnInBoard: (boardId, oldCol, newCol) => {
    const cleanNew = newCol.trim();
    if (!cleanNew || cleanNew === oldCol) return;
    const nextBoards = get().kanbanBoards.map((board) =>
      board.id === boardId
        ? { ...board, columns: board.columns.map((c) => (c === oldCol ? cleanNew : c)), updatedAt: Date.now() }
        : board
    );
    persistBoards(nextBoards);
    set({ kanbanBoards: nextBoards });
  },

  deleteColumnFromBoard: (boardId, column) => {
    const nextBoards = get().kanbanBoards.map((board) => {
      if (board.id !== boardId || board.columns.length <= 1) return board;
      return { ...board, columns: board.columns.filter((c) => c !== column), updatedAt: Date.now() };
    });
    persistBoards(nextBoards);
    set({ kanbanBoards: nextBoards });
  },
});
