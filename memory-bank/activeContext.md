# Active Context: CaffeineMD

## Current Focus
- **Nested Sub-Directory File Movement & Isolated Drag-and-Drop Targeting**:
  - **Recursive Sub-Directory Collection (`MoveModal`, `useTreeStructure`)**:
    - Implemented `collectAllFolderPaths()` in [useTreeStructure.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useTreeStructure.ts) recursively aggregating all full relative paths at every depth across TreeNode hierarchies, active/keep notes' `folder` and `path` fields, and `customFolders`.
    - Revamped [MoveModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/MoveModal.tsx) with depth-based visual indentation (`depth * 14 + 10px`), folder breadcrumb formatting (`Memories / 2026 / October`), and an integrated filter/custom path input preserving internal `/` separators.
  - **Drag-and-Drop Event Isolation (`FolderNode`, `useTreeDragAndDrop`)**:
    - Attached `onDragOver`, `onDragEnter`, `onDragLeave`, and `onDrop` directly to the folder row header element in [FolderNode.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FolderNode.tsx) rather than the outer recursive wrapper.
    - Added `e.stopPropagation()` and `e.preventDefault()` inside all folder drag handlers in [useTreeDragAndDrop.ts](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/hooks/useTreeDragAndDrop.ts) and guarded the canvas drop zone in [FileTree.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileTree.tsx) (`if (e.defaultPrevented) return;`), preventing drop event bubbling to parent folders.
    - Wired draggable relocation attributes (`draggable`, `onNodeDragStart`, `onNodeDragEnd`) through [FileNodeRow.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FileNodeRow.tsx) and [FileTreeItem.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileTreeItem.tsx).
  - **Multi-Segment Normalization & Auto-Expansion (`useFileTreeActions`, `fileOperations`)**:
    - Normalized target destinations in [useFileTreeActions.ts](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/useFileTreeActions.ts) and [fileOperations.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/fileOperations.ts) via `targetFolder.trim().replace(/^\/+|\/+$/g, '')`, preserving internal slashes.
    - Added `expandFolders`, `toggleExpandedFolder`, and `setExpandedFolders` in [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts); auto-expanding all ancestor segments upon note or folder move so newly moved files are immediately visible.
    - Enforced transactional execution in [vaultMutationService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/vaultMutationService.ts) ensuring IndexedDB updates, disk handle syncing for Live Disk Folder mode, note store cache refresh for search indexing, and auto-sync triggering.

## Architecture & Recent Changes
1. **Isolated Drop Target Routing**:
   - Header-level drag event binding with stopPropagation prevents recursive DOM bubbling from overriding child folder drop destinations.
2. **Canonical Folder Path Aggregation**:
   - `collectAllFolderPaths` guarantees all leaf and intermediate subdirectories are selectable in modals and drag zones.
3. **Synchronized Folder Expansion State**:
   - Ancestor expansion in Zustand ensures deep move targets expand automatically in the sidebar tree.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.
