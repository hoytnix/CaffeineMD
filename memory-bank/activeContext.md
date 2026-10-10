# Active Context: Kite Workspace

## Current Focus
Resolved Google Drive upload throughput throttling and added comprehensive Workspace Creation modal supporting both Google Drive and Local Drive workspaces.

## Key Changes
1. **High-Throughput Concurrent Sync Pipeline (`/src/lib/sync/googleDriveSync.ts`)**:
   - Replaced synchronous serial file upload and download loops with a 5-worker parallel concurrency pool (`runWithConcurrency`), multiplexing file streams over HTTP/2.
   - Removed forbidden `'Content-Length'` request headers from resumable PUT chunk requests to eliminate browser CORS preflight rejects and stalled network retry timeouts.
   - Added `createRemoteWorkspace(workspaceName)` to automatically create and bind dedicated `Kite-[workspace]` folders on Google Drive.
   - Maintained backward compatibility with `CHUNK_SIZE = 5 * 1024 * 1024` and `SMALL_FILE_THRESHOLD = 5 * 1024 * 1024`.

2. **Workspace Creation Engine & Modal (`/src/components/workspace/CreateWorkspaceModal.tsx`, `/src/lib/workspaces/workspaceManager.ts`)**:
   - Built interactive `CreateWorkspaceModal` allowing users to create new workspaces under either **Google Drive** or **Local Drive** (Browser Vault via IndexedDB or Live Disk Folder via File System Access API).
   - Embedded Google authentication handshake directly inside the modal for connecting Google accounts without navigating away.
   - Implemented `WorkspaceManager.createLocalWorkspace(name)` and `WorkspaceManager.createGoogleDriveWorkspace(name)`, automatically seeding welcome notes and initializing cloud sync.
   - Added "+ Create Workspace" trigger buttons in `WorkspacePopover` and Settings page.
   - Added distinct workspace icon badges in `WorkspacePopover`: `Cloud` for Google Drive, `HardDrive` for mounted disk folders, and `Database` for IndexedDB vaults.
   - Scoped notes across `FileTree`, `NewNoteModal`, `DatabaseView`, `useGraphData`, and `TagCloudView` to the active workspace.
