# Active Context: Kite Workspace

## Current Focus
File explorer item ellipsis button and contextual action drawer / popover menu:
- Replaced direct trash button on file and folder rows with vertical ellipsis button (`MoreVertical`) visible on hover/focus.
- Implemented click event propagation guards to prevent inadvertent row selection or folder expansion.
- Created `FileActionMenu` slide-out popover drawer anchored to item trigger with outside-click and `Escape` dismissals.
- Implemented file operations repository (`fileOperations.ts`) and dialog modals for **Rename**, **Duplicate**, **Move to...**, and **Trash / Delete**.
- Connected active open tab synchronizer (`renameFileTab`) in workspace store to update open tabs when files are renamed or moved.
- Modularized sidebar tree components (`TrashSection.tsx`, `useFileTreeActions.ts`, `RenameModal.tsx`, `MoveModal.tsx`) adhering strictly to 30-250 LOC constraints.

## Key Changes
1. **File Tree Vertical Ellipsis & Action Popover Menu (`/src/components/sidebar/FileTreeItem.tsx`, `/src/components/sidebar/FileActionMenu.tsx`)**:
   - Replaced direct trash button with `MoreVertical` ellipsis button on both notes and folders.
   - Guarded click events with `e.preventDefault()` and `e.stopPropagation()`.
   - Built accessible `FileActionMenu` anchored to target trigger rect with viewport boundary clamping, dark/light theme styling, outside click listener, and Escape key dismissal.

2. **File Mutation Operations & Tab Synchronizer (`/src/lib/storage/repositories/fileOperations.ts`, `/src/stores/workspaceStore.ts`)**:
   - Implemented `renameVaultFile`, `duplicateVaultFile`, and `moveVaultFile` supporting IndexedDB transactions and mirror updates to mounted Native File System Access API handles.
   - Added `renameFileTab(oldPath, newPath, newTitle)` in `workspaceStore` to dynamically update active and background document tabs.

3. **Contextual Action Modals & Modular Architecture (`/src/components/sidebar/`)**:
   - `RenameModal.tsx`: Uncontrolled keyed dialog for renaming note titles and folder directory names.
   - `MoveModal.tsx`: Destination picker with automatic folder suggestion pills and custom path input.
   - `useFileTreeActions.ts`: Decoupled mutation handler hook.
   - `TrashSection.tsx`: Isolated collapsible ephemeral trash view keeping `FileTree.tsx` within ~248 LOC.

1. **Editor Enter-Key Cursor Loss Bug Fix (`/src/components/editor/TiptapEditor.tsx`, `/src/components/editor/config/editorExtensions.ts`)**:
   - Identified root cause: debounced persistence updates parent file state which triggers `useEffect` comparing HTML lengths. Stripped empty paragraphs or whitespace on Enter resulted in length differences, calling `editor.commands.setContent()` and blowing away ProseMirror cursor selection.
   - Added `loadedPathRef` to strictly control initial note loads and note switches.
   - Added active typing guard: `if (editor.isFocused) return;` inside note synchronization `useEffect` to ensure active editing never resets document state or cursor position.
   - Configured `paragraph: {}` and `hardBreak: { keepMarks: true }` in `StarterKit.configure` to prevent aggressive collapsing of empty block nodes during typing.

2. **Google Drive Sync Progress Engine & Event Bus (`/src/lib/sync/syncProgress.ts`)**:
   - Defined `SyncProgressState` data model (`status`, `currentAction`, `totalFiles`, `processedFiles`, `currentFileName`, `progressPercentage`, `errorMessage`).
   - Implemented reactive `SyncProgressEmitter` event bus with automatic 3.5s reset timer to `idle` upon completion or error.
   - Created `useSyncProgress()` React hook for live UI subscriptions.

3. **Granular Sync Batch Updates (`/src/lib/sync/syncExecutor.ts`, `/src/lib/sync/googleDriveSync.ts`)**:
   - Added file-level processing callbacks (`onFileProcessed`) to `executeDownloadBatch` and `executeUploadBatch`.
   - Wired `syncProgressEmitter` in `GoogleDriveSyncService.syncNow` to emit progress across `scanning`, `syncing`, `completed`, and `error` states.

4. **Visual Sync Progress Bar (`/src/components/workspace/WorkspacePopover.tsx`)**:
   - Integrated `useSyncProgress()` in `WorkspacePopover`.
   - Added pulsing indigo activity indicator to Kite Logo trigger while syncing is active.
   - Rendered animated file-by-file progress bar displaying operation (`Uploading` / `Downloading`), current file name, processed count (`x/y`), percentage, and smooth progress track.

## Key Changes
1. **Phase 1: Core Storage Architecture Deconstruction (`/src/lib/storage/`)**:
   - `schema.ts` (219 LOC): Isolated `KiteVaultDatabase` Dexie class, version stores, `EisenhowerQuadrant`, and record typing interfaces (`VaultFile`, `BacklinkRecord`, `TagRecord`, `VaultMetadata`, `WorkspaceRecord`).
   - `repositories/noteRepository.ts` (193 LOC): Note CRUD operations (`getNote`, `saveNote`, `listNotes`, `bulkUpsertNotes`, `deleteVaultFile`), ephemeral trash lifecycle (`moveToTrash`, `restoreFromTrash`, `getTrashFiles`, `emptyTrash`, `purgeExpiredTrash`), and `seedInitialVaultIfEmpty`.
   - `repositories/assetRepository.ts` (116 LOC): Binary blob handlers (`storeAsset`, `getAsset`, `deleteAsset`, `blobToArrayBuffer`, `arrayBufferToBlob`, `base64ToBlob`, `blobToBase64`).
   - `searchIndex.ts` (101 LOC): Tokenization (`tokenizeText`), n-grams (`generateNGrams`), document scoring (`scoreDocument`), and query ranking (`searchNotesQuery`).
   - `seedData.ts` (177 LOC): Starter knowledge base notes extracted cleanly.
   - `db.ts` (5 LOC): Zero-breaking-change barrel façade re-exporting schema, repositories, and search index.

2. **Phase 1: Google Drive Sync Pipeline Modularization (`/src/lib/sync/`)**:
   - `google/driveApiClient.ts` (227 LOC): Raw Google Drive v3 REST API requests (`driveFetch`, `fetchDriveFiles`, `createDriveFolder`, `downloadRemoteFile`, `downloadRemoteBinary`, `uploadSmallFile`) and typing interfaces (`RemoteWorkspace`, `RemoteDriveFile`, `DriveSyncStatus`).
   - `google/resumableChunkUploader.ts` (232 LOC): 5 MB resumable chunk stream uploader with exponential backoff and session resumption (`initiateResumableSession`, `uploadLargeFileResumable`, `syncFileToDrive`).
   - `google/remoteCrawler.ts` (68 LOC): Recursive remote folder scanner (`crawlRemoteDirectory`, `listAllRemoteFiles`).
   - `reconciler.ts` (70 LOC): Pure two-way diff comparison and timestamp tolerance reconciliation (`reconcileSyncSets`).
   - `syncExecutor.ts` (166 LOC): Concurrency pooled download (`executeDownloadBatch`) and upload (`executeUploadBatch`) runners.
   - `googleDriveSync.ts` (229 LOC): Orchestrator service preserving `GoogleDriveSyncService` API.

3. **Phase 2: Tiptap Editor & Extensibility Shell Deconstruction (`/src/components/editor/`, `/src/hooks/`)**:
   - `config/editorExtensions.ts` (85 LOC): ProseMirror & Tiptap extension configurations (`getEditorExtensions`).
   - `config/editorDomHandlers.ts` (78 LOC): WikiLink DOM navigation and codeblock language auto-detection.
   - `hooks/useEditorDropUpload.ts` (90 LOC): Drag-and-drop & paste media attachment handlers linked to `assetRepository`.
   - `hooks/useEditorSuggestions.ts` (135 LOC): Slash command and WikiLink suggestion popup states.
   - `FloatingToolbarHost.tsx` (59 LOC): Floating menus wrapper.
   - `TiptapEditor.tsx` (243 LOC): Pure UI shell reduced from 641 LOC.

4. **Phase 2: Database View Engines Deconstruction (`/src/components/database/`)**:
   - `DatabaseToolbar.tsx` (98 LOC): Layout container delegating to `toolbar/ViewSwitcher.tsx` (59 LOC), `toolbar/ToolbarSearchInput.tsx` (39 LOC), `toolbar/SortPopover.tsx` (31 LOC), and `toolbar/FilterPopover.tsx` (115 LOC).
   - `TableView.tsx` (142 LOC): Virtual table reduced from 401 LOC delegating to `table/TableHeader.tsx` (75 LOC), `table/TableCellRenderer.tsx` (211 LOC), `table/TableRow.tsx` (123 LOC), and `hooks/useColumnResize.ts` (47 LOC).
   - `KanbanView.tsx` (162 LOC): Reduced from 428 LOC delegating to `kanban/KanbanColumn.tsx` (137 LOC), `kanban/KanbanCard.tsx` (104 LOC), and `hooks/useKanbanDragAndDrop.ts` (135 LOC).

5. **Phase 2: Graph Canvas Engine Modularization (`/src/lib/graph/`)**:
   - `physicsSimulation.ts` (72 LOC): Numerical simulation configurator and boundary constraints (`createGraphSimulation`, `applyBoundaryConstraints`).
   - `renderers/edgeRenderer.ts` (31 LOC): Canvas bezier path rendering and zoom-dependent alpha fading.
   - `renderers/nodeRenderer.ts` (59 LOC): Canvas node circles, Eisenhower halo rings, hover glow, and text labels.
   - `graphCanvasRenderer.ts` (55 LOC): High-DPI canvas orchestrator coordinating render passes.
