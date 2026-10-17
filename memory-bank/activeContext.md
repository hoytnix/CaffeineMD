# Active Context: CaffeineMD

## Current Focus
- **Full Kanban Board & Column CRUD Architecture**:
  - **Storage Registry (`src/lib/config/storageRegistry.ts`)**:
    - Registered `KANBAN_BOARDS` (`caffeinemd-kanban-boards`) and `ACTIVE_KANBAN_BOARD_ID` (`caffeinemd-active-kanban-board`) keys.
  - **Zustand Kanban Slice (`src/stores/slices/kanbanSlice.ts` & `src/stores/workspaceStore.ts`)**:
    - Created `KanbanSlice` managing board-level CRUD (`createKanbanBoard`, `updateKanbanBoard`, `renameKanbanBoard`, `deleteKanbanBoard`, `setActiveBoardId`) and column-level CRUD (`addColumnToBoard`, `renameColumnInBoard`, `deleteColumnFromBoard`) with `storageRegistry` hydration and persistence.
    - Integrated `KanbanSlice` into root `WorkspaceState` and `useWorkspaceStore`.
  - **Modular Kanban UI Components (`src/components/database/kanban/`)**:
    - `KanbanBoardSelector.tsx`: Header navigation bar with board switcher pills, column count badges, group key indicator (`Status` vs `Eisenhower`), `+ New Board`, rename, and delete triggers.
    - `KanbanBoardModals.tsx`: Create, Rename, and Delete board modals built on `ModalShell`.
    - `KanbanColumnMenu.tsx`: Column header popover supporting inline column renaming and deletion with card count badges.
    - `KanbanAddColumnCard.tsx`: Dashed inline `+ Add Column` card at the end of the board viewport.
    - `KanbanColumn.tsx` & `KanbanView.tsx`: Connected active board state, column CRUD handlers, and atomic batch frontmatter migrations via `executeVaultMutation` and `serializeFrontmatter`.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.
