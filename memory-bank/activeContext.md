# Active Context: CaffeineMD

## Current Focus
- **Folder-Scoped "New Note in Folder" Path Resolution & Frontmatter Key Filtering**:
  - **Folder Context Tracking in Workspace Store (`workspaceStore.ts`, `uiOverlaySlice.ts`)**:
    - Added `newNoteParentPath: string | null` and updated `setNewNoteModalOpen(open: boolean, parentPath?: string | null)` to preserve and propagate folder path context across the app.
  - **Tree Actions & Context Menu Wiring (`useFileTreeActions.ts`, `FileTreeModals.tsx`, `FileActionMenu.tsx`, `FileTreeCanvasContextMenu.tsx`)**:
    - Implemented `handleNewNoteInFolder(folderPath: string)` normalizing path targets and passing destination into `setNewNoteModalOpen(true, normalizedPath)`.
    - Wired `onNewNoteInFolder` through `FileTreeModals` and `FileActionMenu`.
    - Retained root default `setNewNoteModalOpen(true, null)` for global keyboard shortcuts (`⌘N`) and canvas context menu triggers.
  - **Destination Path Construction & Modal Indicator (`NewNoteModal.tsx`, `useTreeStructure.ts`)**:
    - Injected destination indicator (`Creating in: <folder>`) into modal header and body.
    - Sanitized file names and constructed final full paths prefixed with parent directory (`${folder}/${cleanName}` vs `/${cleanName}`).
    - Normalized path segmentation in `useTreeStructure.ts` to prevent empty root folder artifacts.
  - **Reserved Frontmatter Key Sanitization (`frontmatter.ts`, `NotePropertiesCard.tsx`, sync engines)**:
    - Defined `RESERVED_FRONTMATTER_KEYS = new Set(['data', 'meta', 'content', '_raw', '_id', 'body'])` and exported `filterVisibleFrontmatter()`.
    - Sanitized `NotePropertiesCard.tsx` property rendering and prevented creating custom properties matching reserved keys.
    - Updated sync processors (`driveSyncRunner.ts`, `syncExecutor.ts`) to store parsed data without AST wrapper keys.

## Architecture & Recent Changes
1. **Target-Aware Note Creation Pipeline**:
   - Sidebar folder action menus now preserve and transmit the folder path context to `NewNoteModal`, which builds complete paths without defaulting to root `/`.
2. **Deterministic Frontmatter Metadata Filtering**:
   - Internal parser/AST envelope keys (`data`, `meta`, `content`) are stripped from frontmatter display and user interaction cards.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.

