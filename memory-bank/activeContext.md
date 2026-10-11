# Active Context: Kite Workspace

## Current Focus
Standardized list bullet vertical alignment and nested indentation hierarchy across rich-text editor:
- Configured explicit indentation units (`padding-left: 1.5rem`) on `.tiptap ul` / `.ProseMirror ul` and `ol`.
- Established distinct nested bullet markers: `disc` (level 1) -> `circle` (level 2) -> `square` (level 3+), and ordered lists `decimal` -> `lower-alpha` -> `lower-roman`.
- Fixed list item vertical alignment: switched `.tiptap li > p` to `display: block` with `line-height: 1.6` and `margin: 0`, eliminating floating or misplaced bullet markers.
- Nested sub-lists inside list items now indent cleanly and flush with parent content (`padding-left: 1.5rem`, `margin: 0.125rem 0`).
- Standardized task checklist item alignments (`ul[data-type="taskList"] li`) with flex container and explicit nested task list indentation.
- Bound `kite-editor-content` utility class to `EditorContent` in `TiptapEditor.tsx`.
- Synchronized PlaintextMarkdownEditor line numbers gutter scroll position with textarea vertical scroll (`lineNumbersRef`, `handleScroll`).

## Key Changes
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
