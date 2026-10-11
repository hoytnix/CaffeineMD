# Active Context: Kite Workspace

## Current Focus
Resolved mobile touch button visibility for file tree items, trash actions, and document tabs. Fixed folder/file upload pipeline to import notes directly into the active workspace rather than defaulting to "default-vault" / "Local Vault".

## Key Changes
1. **File Tree & Trash Item Action Mobile Visibility (`/src/components/sidebar/FileTreeItem.tsx`, `/src/components/sidebar/FileTree.tsx`)**:
   - Replaced hover-exclusive visibility (`opacity-0 group-hover:opacity-100`) with responsive classes (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).
   - Added minimum tap target dimensions (`min-h-[28px] min-w-[28px]` with flex centering and tap padding) to prevent accidental note selection on touch devices.

2. **Editor Document Tab Close Button Mobile Visibility (`/app/page.tsx`)**:
   - Updated tab close (`X`) buttons to remain visible at `opacity-100` whenever the tab is active or viewed on touch/mobile viewports (`opacity-100 md:opacity-0 md:group-hover:opacity-100` on inactive desktop tabs).

3. **Active Workspace Scoping for Folder/File Imports & Note Creation (`/src/components/upload/VaultDropzone.tsx`, `/src/hooks/useVaultMounting.ts`, `/src/components/database/KanbanView.tsx`, `/src/components/editor/TiptapEditor.tsx`)**:
   - Read `activeWorkspaceId` from `useWorkspaceStore` in `VaultDropzone` and `useVaultMounting`, passing `targetWorkspaceId` to `runIngestionPipeline`.
   - Guaranteed all imported files, directories, attachments, and backlinks are assigned `targetWorkspaceId` in IndexedDB (`db.files.put`), allowing notes to immediately display in the active workspace view.
   - Updated WikiLink note auto-creation and Kanban board card creation to scope new notes to `activeWorkspaceId || 'default-vault'`.
