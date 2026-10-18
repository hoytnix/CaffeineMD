# Active Context: CaffeineMD

## Current Focus
- **Full Kanban Board & Column CRUD Architecture**:
  - **Storage Registry (`src/lib/config/storageRegistry.ts`)**:
    - Registered `KANBAN_BOARDS` (`caffeinemd-kanban-boards`) and `ACTIVE_KANBAN_BOARD_ID` (`caffeinemd-active-kanban-board`) keys.
  - **Zustand Kanban Slice (`src/stores/slices/kanbanSlice.ts` & `src/stores/workspaceStore.ts`)**:
    - Created `KanbanSlice` managing board-level CRUD (`createKanbanBoard`, `updateKanbanBoard`, `renameKanbanBoard`, `deleteKanbanBoard`, `setActiveBoardId`) and column-level CRUD (`addColumnToBoard`, `renameColumnInBoard`, `deleteColumnFromBoard`) with `storageRegistry` hydration and persistence.
    - Integrated `KanbanSlice` into root `WorkspaceState` and `useWorkspaceStore`.
  - **Modular Kanban UI Components (`src/components/database/kanban/`)**:
    - `KanbanBoardSelector.tsx`: Header navigation bar with board switcher pills, column count badges, group key indicator (`Status` vs `Eisenhower`), HTML5 drag-and-drop reordering with active drag/drop indicator ring feedback, `+ New Board`, rename, and delete triggers.
    - `KanbanBoardModals.tsx`: Create, Rename, and Delete board modals built on `ModalShell`.
    - `KanbanColumnMenu.tsx`: Column header popover supporting inline column renaming and deletion with card count badges.
    - `KanbanAddColumnCard.tsx`: Dashed inline `+ Add Column` card at the end of the board viewport.
    - `KanbanColumn.tsx` & `KanbanView.tsx`: Connected active board state, column CRUD handlers, board reordering callback, HTML5 column header drag-and-drop reordering (`reorderColumnsInBoard`, `useKanbanDragAndDrop`), and atomic batch frontmatter migrations via `executeVaultMutation` and `serializeFrontmatter`.
- **SEO, AI Search & Structured Data**:
  - Implemented production-grade `public/robots.txt` prioritizing AI answer engine citation crawlers (PerplexityBot, ChatGPT-User, OAI-SearchBot, Claude-Web) and core search engines (Googlebot, Bingbot, Applebot).
  - Explicitly allowed Next.js static assets and stylesheets for headless client-side rendering while blocking crawl-budget traps, dynamic queries, and internal API routes.
  - Configured JSON-LD Organization entity in `app/layout.tsx` to `TehWiz Productions` (`https://tehwiz.com`).

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.

