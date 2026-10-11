# Active Context: Kite Workspace

## Current Focus
Implemented incremental Google Drive sync delta checks, native drag-and-drop status updates in Kanban view, and icon-only Eisenhower Matrix priority dots with tooltip labels.

## Key Changes
1. **Incremental Google Drive Sync Delta Check (`/src/lib/sync/googleDriveSync.ts`)**:
   - Added metadata comparison (`modifiedTime`, `md5Checksum`) in Google Drive sync pipeline.
   - For upload: skipped files where local note `updatedAt` is not newer than remote `modifiedTime` when already mapped; updated files use PATCH/update requests via `uploadSmallFile` or `uploadLargeFileResumable`.
   - For download: skipped remote files when local note `updatedAt` is greater than or equal to remote `modifiedTime`, accurately reporting `stats.skipped`.

2. **Kanban Drag-and-Drop Card Status Updates (`/src/components/database/KanbanView.tsx`)**:
   - Added HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragEnd`, `onDragOver`, `onDragLeave`, `onDrop`) to cards and column containers.
   - Dropping a card on any column automatically updates the note's frontmatter status and persists changes in IndexedDB, with real-time drop target highlighting (`ring-2 ring-indigo-500/30`).

3. **Eisenhower Matrix Icon-Only Indicator (`/src/components/database/KanbanView.tsx`)**:
   - Stripped out textual labels from priority indicators on Kanban cards, rendering clean `w-2.5 h-2.5 rounded-full` dots with accessible `title` and `aria-label` tooltips.
