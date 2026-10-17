# Active Context: CaffeineMD

## Current Focus
- **7-Target Architectural Refactoring & Modularization (<250 LOC Ceiling)**:
  - **Workspace Root (`app/w/[workspaceId]/page.tsx`)**:
    - Extracted global keyboard shortcut listener into `src/hooks/useWorkspaceKeyboardShortcuts.ts`.
    - Extracted ambient theme backdrop resolution and initial vault seeding into `src/hooks/useWorkspaceThemeBackdrop.ts`.
    - Simplified `page.tsx` to 177 LOC as a clean layout orchestrator.
  - **FileTree Sidebar (`src/components/sidebar/FileTree.tsx`)**:
    - Extracted live Dexie queries, workspace filtering, and tree hierarchy resolution into `src/components/sidebar/hooks/useFileTreeSearch.ts`.
    - Extracted internal node relocation and drag-and-drop orchestration into `src/components/sidebar/hooks/useFileTreeDragController.ts`.
  - **TiptapEditor Host (`src/components/editor/TiptapEditor.tsx`)**:
    - Extracted YAML frontmatter property reconciliation into `src/components/editor/hooks/useEditorProperties.ts`.
    - Extracted ProseMirror cursor centering into `src/components/editor/hooks/useTypewriterScroll.ts`.
  - **DatabaseView Controller (`src/components/database/DatabaseView.tsx`)**:
    - Extracted multi-filter state and schema projection into `src/components/database/hooks/useDatabaseFilterState.ts`.
    - Extracted record creation mutations into `src/components/database/hooks/useDatabaseMutations.ts`.
  - **GraphView Renderer (`src/components/graph/GraphView.tsx`)**:
    - Extracted D3 force simulation lifecycle and tick loop into `src/components/graph/hooks/useGraphSimulation.ts`.
    - Extracted canvas pan/zoom affine transform and hit-testing into `src/components/graph/hooks/useGraphCanvasTransform.ts`.
  - **Export Suite (`ExportOptionsForm.tsx` & `ExportPreviewDrawer.tsx`)**:
    - Extracted `ExportScopeSelector.tsx` and `PwaConfigSection.tsx` under `src/components/export/sections/`.
    - Extracted `usePreviewBlobUrl.ts` and `viewportDimensions.ts` under `src/components/export/`.
  - **Storage Registry Consolidation**:
    - Consolidated remaining direct `localStorage` calls in `workspaceStore.ts`, `themeStorageSlice.ts`, and `uiOverlaySlice.ts` into `storageRegistry`.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.
