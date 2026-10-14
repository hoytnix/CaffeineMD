# Active Context: CaffeineMD

## Current Focus
- **Architectural Consolidation & 7-Vector Next.js DRY Audit (Phases 1 & 3)**:
  - **Leaf Type, Hook & Storage Consolidation (`DRY-07`, `DRY-08`, `DRY-09`)**:
    - Created canonical [utils.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/utils.ts) and [use-mobile.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/use-mobile.ts) with root re-exports to eliminate alias mismatch and duplicate mobile breakpoint checks.
    - Unified sandbox runner types (`EmitFn`, `ProgressFn`, `RunnerContext`, `RunnerResult`) in canonical [types.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/types.ts) and re-exported from [runners/types.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runners/types.ts).
    - Introduced canonical typed, SSR-guarded [storageRegistry.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/config/storageRegistry.ts) with `STORAGE_KEYS` registry and migrated [themeStorageUtils.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/themeStorageUtils.ts), [firebase/client.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/firebase/client.ts), [geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts), and [trashSlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/trashSlice.ts).
  - **Client Interaction Hooks (`DRY-03`, `DRY-06`)**:
    - Extracted canonical zero-allocation [usePointerResize.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/usePointerResize.ts) hook handling mouse and touch pointer events, cursor styling, and cleanup. Consumed in [useSidebarResize.ts](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/hooks/useSidebarResize.ts) and enhanced [useColumnResize.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useColumnResize.ts).
    - Upgraded [useContextMenu.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useContextMenu.ts) to provide shared `useFloatingDismiss` with viewport boundary clamping, outside click dismissal, and Escape-key handling; wired into [ContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/common/ContextMenu.tsx).
  - **UI Shell Primitives (`DRY-01`)**:
    - Created accessible, composable [ModalShell.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/common/ModalShell.tsx) with `cva` sizing (`sm`, `md`, `lg`, `xl`), backdrop overlay, escape key dismissal, and header/footer chrome.
    - Migrated [RenameModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/RenameModal.tsx), [MoveModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/MoveModal.tsx), [NewNoteModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/NewNoteModal.tsx), [DeleteConfirmModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/common/DeleteConfirmModal.tsx), [CreateWorkspaceModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/CreateWorkspaceModal.tsx), [InstallModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/InstallModal.tsx), [TemplateSelectorModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/TemplateSelectorModal.tsx), [VaultFindReplaceModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/search/VaultFindReplaceModal.tsx), and [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx).
    - Removed redundant wrapper `FileModals.tsx` in favor of direct imports in [FileTreeModals.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FileTreeModals.tsx).
  - **Gemini AI Service & Route Handler Unification (`DRY-04`)**:
    - Built isomorphic [geminiClient.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/ai/geminiClient.ts) (`generateStructuredGeminiOutput`) with model cascade fallback, markdown fence stripping, JSON parsing, and Zod validator integration.
    - Refactored [route.ts](file:///home/oloty/Dev/CaffeineMD/app/api/theme/generate/route.ts), [aiThemeService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/aiThemeService.ts), and [geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts).
  - **Export Pre-Compiler & Vault Mutation DAL (`DRY-02`, `DRY-05`)**:
    - Added `compileVaultExportContext()` to [exportBundleService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/exportBundleService.ts) unifying frontmatter parsing, markdown-to-HTML compilation, search indexing, and graph payload generation.
    - Created [vaultMutationService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/vaultMutationService.ts) with `executeVaultMutation()` unifying Dexie IndexedDB writes, disk folder synchronization, and debounced Google Drive auto-sync across [useNotePersistence.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useNotePersistence.ts), [trashSlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/trashSlice.ts), [DatabaseView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/database/DatabaseView.tsx), and [useFileTreeActions.ts](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/useFileTreeActions.ts).

## Architecture & Recent Changes
1. **Unified Storage & Env Registry**:
   - `storageRegistry.ts` centralizes string/JSON localStorage reads/writes with SSR protection and Zod schema safety.
2. **Canonical Modal Shell Architecture**:
   - `ModalShell.tsx` centralizes backdrop overlay, Escape listener, card sizing, and click-outside dismissal across 9 modals.
3. **Transactional Mutation Service**:
   - `vaultMutationService.ts` ensures all note/folder mutations propagate to local disk and background cloud sync without duplicate dynamic imports.

## Next Steps
- Maintain strict <250 LOC per file across all modules.
- Verification: Run `pnpm run lint` on every prompt cycle.
