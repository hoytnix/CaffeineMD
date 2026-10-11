# Active Context: Kite Workspace

## Current Focus
Enhanced note title behavior in `TiptapEditor.tsx` by converting the single-line text input into an auto-resizing, multi-line textarea with dynamic scrollHeight adjustment, word breaking, and Enter-key focus transition to the editor canvas, preventing horizontal text scrolling and allowing long note titles to naturally overflow into new lines.

## Key Changes
1. **Step 1: Modular Theme Definitions & Color Utilities (`/src/lib/themes/`)**:
   - `colorUtils.ts` (177 LOC): Hex/RGB/HSL conversion, WCAG luminance calculations, contrast ratio checks, and root CSS custom properties DOM injector.
   - `presets/baseThemes.ts` (109 LOC): Light, Dark, Solarized Light, Solarized Dark, Monokai.
   - `presets/seasonalThemes.ts` (117 LOC): Spring, Summer, Autumn, Winter.
   - `presets/customThemes.ts` (154 LOC): Forest, Seahorse, Deep Sea, Microsoft, Hacker, Custom.
   - `themeDefinitions.ts` (56 LOC): Unified index contract barrel re-exporting all presets, types, and color utilities.

2. **Step 2: Decomposed Settings View God Component (`/src/components/settings/`)**:
   - `sections/ThemeSettingsSection.tsx` (200 LOC): 2-to-4 column responsive theme selector cards and active theme preview chips.
   - `sections/CustomThemeBuilder.tsx` (213 LOC): AI Theme Studio generation input and color picker inputs.
   - `sections/GoogleDriveSyncSection.tsx` (199 LOC): Google SSO connection cards, sync triggers, folder ID bindings, and sync status badges.
   - `sections/RemoteWorkspacesList.tsx` (143 LOC): Google Drive remote workspace discovery, active status badges, and download triggers.
   - `sections/StorageSettingsSection.tsx` (182 LOC): IndexedDB storage usage indicators, ephemeral trash retention sliders, and vault purge confirmations.
   - `sections/useGoogleDriveSyncSettings.ts` (238 LOC): Decoupled Google auth and sync state management hook.
   - `SettingsView.tsx` (108 LOC): Clean orchestration shell layout.

3. **Step 3: Decomposed Bottom Editor Toolbar (`/src/components/editor/`)**:
   - `toolbar/HeadingSelectorPopover.tsx` (138 LOC): H1–H6 heading selection context popover menu with active heading state triggers and normal paragraph option.
   - `toolbar/TableControlsGroup.tsx` (109 LOC): Insert table, add/remove row, and add/remove column buttons.
   - `toolbar/ListFormattingGroup.tsx` (115 LOC): Bullet list, numbered list, task checklist, and list indent/outdent controls.
   - `toolbar/EditorStatusMetrics.tsx` (113 LOC): Live word count, character count, reading time estimation, and cloud sync status badge.
   - `toolbar/MarkFormattingGroup.tsx` (211 LOC): Bold, italic, underline, strike, code, blockquote, link, HR, undo, redo, and copy note actions.
   - `EditorBottomToolbar.tsx` (96 LOC): Composed toolbar layout with mouse drag-to-scroll panning.

4. **Step 4: Decomposed Virtual Table Database View (`/src/components/database/`)**:
   - `table/TableColumnResizer.tsx` (106 LOC): Header column drag handle, keyboard arrow navigation, boundary clamping, and visual guide indicator.
   - `table/TableCellFactory.tsx` (231 LOC): Type-based cell rendering for Title, Tags, Status, Date, Eisenhower Matrix dots, and Author.
   - `table/TablePaginationBar.tsx` (124 LOC): Row count summary, page size picker, and pagination navigation controls.
   - `table/TableRow.tsx` (123 LOC): Table row wrapper delegating cell rendering to `TableCellFactory`.
   - `TableView.tsx` (163 LOC): Clean table DOM composition and sorting state mapping.

5. **Step 5: Modularized Recursive File Tree Operations (`/src/components/sidebar/`)**:
   - `hooks/useTreeDragAndDrop.ts` (105 LOC): Drag-and-drop ingestion from native filesystem and internal tree relocation calculations.
   - `tree/FolderNode.tsx` (103 LOC): Recursive expandable/collapsible folder node rendering.
   - `tree/FileNodeRow.tsx` (112 LOC): Individual note leaf row rendering with Eisenhower priority dots and ellipsis action menu trigger.
   - `tree/FileTreeModals.tsx` (111 LOC): Composite modal orchestrator mounting New Note, Rename, Move, and Action drawer dialogs.
   - `FileTree.tsx` (213 LOC): Workspace directory container mounting search bar, root tree nodes, trash section, and toolbar.

6. **Step 6: Decoupled Tiptap Editor Lifecycle & Persistence (`/src/components/editor/`)**:
   - `hooks/useTiptapInit.ts` (130 LOC): Tiptap v2 editor instance lifecycle, extension loading, ProseMirror DOM event handlers, and Enter-key cursor focus protections.
   - `hooks/useEditorAutosave.ts` (133 LOC): Debounced note persistence, IndexedDB dirty checking, ⌘S shortcut, and rich-text / plaintext mode switching.
   - `components/EditorDragOverlay.tsx` (109 LOC): Drag-and-drop file upload backdrop and supported format guidelines.
   - `TiptapEditor.tsx` (172 LOC): Pure container shell rendering header, content canvas, backlinks panel, and floating menus.

7. **Step 7: Modularized Google Drive Cloud Sync Engine (`/src/lib/sync/`)**:
   - `google/driveAuthService.ts` (117 LOC): OAuth2 token acquisition, credential storage, 401 interceptors, and authenticated header builder.
   - `google/drivePayloadBuilder.ts` (121 LOC): MIME multipart boundary generator, metadata JSON serialization, and note Blob packaging.
   - `google/driveReconciler.ts` (108 LOC): Differential reconciliation logic comparing remote timestamps against local Dexie note revisions.
   - `google/driveSyncRunner.ts` (125 LOC): Batch download and upload orchestration loop with real-time sync progress emitter updates.
   - `googleDriveSync.ts` (213 LOC): High-level façade orchestrating auth, payload builder, reconciler, and runner while preserving full public API signatures.
