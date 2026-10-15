# Active Context: CaffeineMD

## Current Focus
- **Google Drive Sync In-Place Move / Reparent & Anti-Resurrection Engine**:
  - **Stable Remote IDs & Move History Tracking (`schema.ts`, `pendingMoves.ts`, `fileOperations.ts`)**:
    - Added `driveId`, `lastSyncedPath`, and `previousPath` to `VaultFile` across [schema.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/schema.ts) and IndexedDB DAL.
    - Updated `renameVaultFile`, `moveVaultFile`, `renameFolder`, and `moveFolder` in [fileOperations.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/fileOperations.ts) to preserve remote IDs, update `lastSyncedPath`, and track `previousPath`.
    - Created [pendingMoves.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/pendingMoves.ts) recording folder moves for atomic cloud synchronization.
  - **In-Place Move / Reparent & Empty Folder Pruning API (`driveApiClient.ts`, `driveFolderSync.ts`)**:
    - Implemented `moveOrRenameDriveFile()` in [driveApiClient.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveApiClient.ts) executing `PATCH /drive/v3/files/{fileId}?addParents=...&removeParents=...` and body `{ name }`.
    - Implemented `deleteRemoteFile()` supporting permanent deletion or trashing of stale remote files and empty folders.
    - Created [driveFolderSync.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveFolderSync.ts) providing `syncPendingFolderMoves()` for atomic remote folder reparenting, `ensureRemoteFolderPath()` for hierarchical path resolution, `pruneEmptiedRemoteFolders()` for cleanup, and `moveRemoteNote()` for in-place file relocation.
  - **Differential Reconciliation & Move Detection (`driveReconciler.ts`, `reconciler.ts`, `driveSyncRunner.ts`)**:
    - Upgraded `crawlRemoteWorkspace()` in [remoteCrawler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/remoteCrawler.ts) to track remote folder structures and parent IDs.
    - Updated `reconcileDriveState()` in [driveReconciler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveReconciler.ts) and `reconcileSyncSets()` in [reconciler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/reconciler.ts) to match local files to remote files via `driveId` / `driveFileId` and `lastSyncedPath` / `previousPath`.
    - Prevented duplicate downloads and folder resurrection by recognizing local moves as `move_remote` operations rather than new uploads + old downloads.
    - Connected `runDriveSyncCycle()` in [driveSyncRunner.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveSyncRunner.ts) to reparent folder nodes, relocate remote files, and update local Dexie records with `lastSyncedPath`.

## Architecture & Recent Changes
1. **Atomic Remote Folder Reparenting**:
   - Folders on Google Drive are reparented directly via `addParents`/`removeParents`, moving all children atomically and eliminating duplicate folder creation.
2. **Move Tombstones & Remote ID Persistence**:
   - `VaultFile` retains remote identifiers through local renames and moves, preventing the reconciler from misinterpreting relocated local notes as missing files.
3. **Emptied Folder Pruning**:
   - Stale remote ancestor directories left vacant after items move are automatically pruned on Google Drive.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.

