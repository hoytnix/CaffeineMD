# Active Context: Kite Workspace

## Current Focus
Completed Strategic Modular Refactoring (Phase 1 & Phase 2):
Refactored all 7 monolithic modules (>400 LOC) across storage, sync, editor, database, and graph canvas into clean, decoupled submodules with every file strictly within 30–250 LOC (and backwards-compatible barrel façades where appropriate), guaranteeing zero regression in storage persistence, sync reconciliation, and editor UX.

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
