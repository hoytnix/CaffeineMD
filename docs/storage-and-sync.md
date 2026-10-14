# Local-First Storage, Indexing & Google Drive Sync

This document provides a comprehensive deep dive into CaffeineMD's local-first storage architecture, filesystem mounting, full-text search indexing, and Google Drive cloud synchronization engine.

---

## 1. IndexedDB & Dexie Schema

CaffeineMD operates as a client-first application backed by **Dexie.js 4.0**, wrapping the browser's native IndexedDB. The database is declared as `KiteVaultDatabase` in [`src/lib/storage/schema.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/schema.ts) and exported via [`src/lib/storage/db.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/db.ts).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      IndexedDB: KiteVaultDatabase                      │
├─────────────┬─────────────┬─────────────┬──────────────┬───────────────┤
│    files    │  backlinks  │    tags     │   settings   │  workspaces   │
│   (notes)   │             │             │              │               │
├─────────────┼─────────────┼─────────────┼──────────────┼───────────────┤
│ id [PK]     │ id [PK]     │ name [PK]   │ key [PK]     │ id [PK]       │
│ path        │ sourcePath  │ count       │ value        │ name          │
│ name        │ sourceTitle │             │              │ mode          │
│ title       │ targetTitle │             │              │ handle        │
│ extension   │ targetPath  │             │              │ driveFolderId │
│ isBinary    │ vaultId     │             │              │ updatedAt     │
│ *tags       │             │             │              │               │
│ vaultId     │             │             │              │               │
│ updatedAt   │             │             │              │               │
└─────────────┴─────────────┴─────────────┴──────────────┴───────────────┘
```

### 1.1 Object Stores & Indexes

1. **`files` (Aliased as `notes`)**:
   - Primary Store containing all markdown documents, plaintext files, and embedded assets.
   - **Primary Key**: `id` (normalized virtual path e.g., `projects/launch.md` or `root-note.md`).
   - **Key Fields**:
     - `title`: Extracted from YAML frontmatter `title` or derived from the basename.
     - `content`: Raw Markdown document string with frontmatter block preserved.
     - `frontmatter`: Parsed key-value metadata object (tags, status, author, dates).
     - `eisenhower`: Priority quadrant enum (`urgent_immediate`, `urgent_not_immediate`, etc.).
     - `isTrash`: Soft-delete flag (`true` when moved to trash).
     - `originalPath`: Preserves the pre-trash path for 1-click restoration.
     - `isBinary` & `blob`: Media asset flag and binary blob payload (images, audio).
     - `driveFileId`: Google Drive remote file ID mapping for cloud reconciliation.
     - `vaultId`: Workspace isolation key (e.g., `default-vault` or `ws-123456`).
   - **Multi-Entry Index**: `*tags` allows fast indexed queries across array values (`db.files.where('tags').equals('tech')`).

2. **`backlinks`**:
   - Indexes references created by `[[WikiLink]]` tokens.
   - Primary Key: `${sourcePath}::${targetTitle}`.
   - Enables instantaneous retrieval of incoming links and unlinked mentions without full document scans.

3. **`tags`**:
   - Aggregated tag dictionary tracking global usage counts for tag cloud rendering.

4. **`settings`**:
   - Generic key-value store for vault metadata, layout cache, and last opened tabs.

5. **`workspaces`**:
   - Tracks distinct vaults (`mode: 'indexeddb' | 'filesystem'`), storing native `FileSystemDirectoryHandle` references for live OS directory persistence.

---

## 2. Repositories & File System Bridge

Storage operations are abstracted behind dedicated repositories in [`src/lib/storage/repositories/`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/):

### 2.1 Repositories Overview
- **`noteRepository.ts`**: High-level note operations: `createNote()`, `updateNote()`, `getNote()`, and `deleteNote()`. Automatically computes word/char counts and triggers background sync.
- **`fileOperations.ts`**: Vault tree manipulations: `renameVaultFile()`, `duplicateVaultFile()`, `moveVaultFile()`, `renameFolder()`, `moveFolder()`, and recursive directory renaming.
- **`assetRepository.ts`**: Ingestion, MIME-type detection, Base64 extraction, and binary blob storage for dragged or pasted attachments.

### 2.2 Soft-Delete (Trash) vs. Permanent Deletion
CaffeineMD employs a non-destructive deletion lifecycle:
```
Active Note ──► moveToTrash() ──► Soft-Deleted (isTrash: true) ──► purgeTrash() ──► Dexie.delete()
                     │                        │
                     └── originalPath saved   └── restoreFromTrash() ──► Restored to original path
```
1. **`moveToTrash(filePath)`**: Sets `isTrash: true`, records `deletedAt: Date.now()`, and stores `originalPath: filePath`. When a folder is deleted, all child notes are recursively soft-deleted.
2. **`restoreFromTrash(id)`**: Moves the note back to its original path (or vault root if the parent folder was permanently deleted).
3. **`purgeTrash()`**: Permanently executes `db.files.bulkDelete()` and dispatches remote deletion calls to Google Drive.

### 2.3 Seed Data Initialization
When a user opens CaffeineMD for the first time, [`src/lib/storage/seedData.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/seedData.ts) inspects IndexedDB:
- If `db.files.count() === 0`, it loads [`welcomeNoteContent.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/welcomeNoteContent.ts), creating `/Welcome to CaffeineMD ☕.md` directly at root (`folder: ''`), populating demo frontmatter, Eisenhower matrix tags, and starter WikiLinks.

### 2.4 Native File System Access API Mounting
- Handled by [`src/lib/storage/fileSystem.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/fileSystem.ts) and [`src/hooks/useVaultMounting.ts`](file:///home/oloty/Dev/CaffeineMD/src/hooks/useVaultMounting.ts).
- Invokes `window.showDirectoryPicker({ mode: 'readwrite' })` to obtain a persistent OS directory handle.
- Stores the directory handle directly in IndexedDB (`workspaces` table).
- Reads and writes markdown notes directly to the host computer's hard drive while maintaining an indexed cache in IndexedDB.

### 2.5 Drag-and-Drop Ingestion Pipeline
- [`src/lib/storage/entryCrawler.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/entryCrawler.ts) traverses WebKit directory trees (`webkitGetAsEntry`).
- [`src/lib/storage/importPipeline.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/importPipeline.ts) batches file additions, filters out system files (`.DS_Store`, `.git`), detects markdown extensions, and populates IndexedDB in transactions.

---

## 3. Search Engine & Batch Find/Replace

### 3.1 MiniSearch In-Memory Search Index
Fast fuzzy search (`⌘K` / `⌘P`) is driven by **MiniSearch** in [`src/lib/storage/searchIndex.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/searchIndex.ts):
- **Indexed Fields**: `title` (boost: 3), `tags` (boost: 2), and `content` (boost: 1).
- **Search Options**: Prefix matching, fuzzy edit distance (max distance 0.2), and BM25 ranking.
- **Incremental Indexing**: [`batchIndexer.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/batchIndexer.ts) keeps the in-memory index synchronized whenever notes are created, modified, or trashed.

### 3.2 Vault-Wide RegEx Find & Replace
Located in [`src/lib/search/vaultFindReplace.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/search/vaultFindReplace.ts) and rendered via `VaultFindReplaceModal.tsx` (`⌘⇧H`):
- **Pattern Matching**: Evaluates regular expressions with capture groups across all notes in IndexedDB.
- **Visual Diff Preview**: Generates unified diff previews for every matched line before replacement.
- **Atomic Execution**: User-selected target files are updated atomically within a single IndexedDB transaction.
- **Rollback Snapshots**: Pushes an immutable before-state snapshot to `findReplaceStore`, allowing instant 1-click reversal.

---

## 4. Google Drive Auto-Sync Engine

CaffeineMD features a bidirectional Google Drive synchronization engine located in [`src/lib/sync/`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/):

```
                       ┌────────────────────────────┐
                       │    Storage Repositories    │
                       │   (Create / Move / Trash)  │
                       └─────────────┬──────────────┘
                                     │
                        triggerBackgroundAutoSync()
                                     │ (Debounced 1500ms)
                                     ▼
                       ┌────────────────────────────┐
                       │     googleDriveSync.ts     │
                       └─────────────┬──────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────┐                             ┌──────────────────────┐
│  driveAuthService.ts │                             │  driveReconciler.ts  │
│  • Token Lifetime    │                             │  • 2-Way Delta       │
│  • Offline Refresh   │                             │  • Anti-Resurrection │
│  • Local Persistence │                             │  • Chunked Uploads   │
└──────────────────────┘                             └──────────────────────┘
```

### 4.1 OAuth Token Lifetime & Persistence
- Implemented in [`src/lib/sync/google/driveAuthService.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveAuthService.ts).
- Requests offline scope (`access_type: 'offline'`, `prompt: 'consent'`).
- Saves access tokens, expiry timestamps, and user profile information in both `localStorage` and `sessionStorage`.
- Ensures users stay authenticated across browser tab reloads and system restarts without repeated login prompts.

### 4.2 Two-Way Reconciliation & Anti-Resurrection Guards
- Implemented in [`src/lib/sync/google/driveReconciler.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveReconciler.ts) and [`reconciler.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/reconciler.ts).
- **Anti-Resurrection Protection**: If a note is marked `isTrash: true` or `isDeleted: true` locally, the reconciler flags it for remote deletion on Google Drive instead of mistakenly downloading it as a "new" remote note.
- **Timestamp Conflict Resolution**: Compares `updatedAt` timestamps between local Dexie records and Google Drive `modifiedTime` metadata to resolve collisions gracefully.

### 4.3 5MB Resumable Chunked Uploads
- Handled by [`src/lib/sync/google/resumableChunkUploader.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/resumableChunkUploader.ts).
- Notes and large binary assets (>5MB) are uploaded via Google Drive Resumable Upload protocol using chunked `PUT` requests with byte-range headers (`Content-Range: bytes 0-5242879/10485760`).
- If an upload is interrupted by network dropouts, the uploader queries the remote offset and resumes from the last confirmed chunk.

### 4.4 Automated Background CRUD Triggers
- [`src/lib/sync/syncAutoTrigger.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/syncAutoTrigger.ts) provides a dynamic, circular-import-safe helper: `triggerBackgroundAutoSync(debounceMs = 1500)`.
- Automatically invoked upon:
  - Editor note saves and frontmatter updates (`useNotePersistence.ts`).
  - Note creation (`NewNoteModal.tsx`, `DatabaseView.tsx`).
  - File/folder rename, move, duplicate, and deletion (`useFileTreeActions.ts`, `fileOperations.ts`, `noteRepository.ts`, `workspaceStore.ts`).
