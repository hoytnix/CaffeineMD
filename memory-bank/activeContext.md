# Active Context: Kite Workspace

## Current Focus
Universal emoji embedding and document metrics enhancements:
1. Positioned `Copy All as Markdown` at the very left of the toolbar.
2. Grouped Bold, Italic, Underline, and Strikethrough into `StyleSelectorPopover.tsx`.
3. Consolidated bullet list, numbered list, task checklist, and indentation into `ListFormattingGroup.tsx`.
4. Extracted Inline Code, Code Blocks, Quotes, Links, and Images into `MediaSelectorPopover.tsx`.
5. Created `HistorySelectorPopover.tsx` grouping Undo (`⌘Z`) and Redo (`⌘⇧Z`) in a dedicated history popover menu.
6. Relocated `TableControlsGroup.tsx` immediately to the left of `HistorySelectorPopover.tsx`.
7. Created and enhanced `NoteMetricsBar.tsx` (207 LOC) positioned immediately above NOTE PROPERTIES (`BacklinksPanel.tsx`), displaying live Word Count, Character Count, LLM Token Count, Emoji Count, Link Count (Markdown, WikiLinks, HTML anchors, bare URLs), and Kilobytes (KB) in both Rich Text (`useSyncExternalStore`) and Plaintext modes.
8. Embedded universal color emoji rendering via Google Fonts `Noto Color Emoji` with dynamic Unicode subsetting (`app/globals.css`, `app/layout.tsx`), prioritizing emoji fonts ahead of `sans-serif` and preserving fallbacks across all dynamic themes (`src/lib/themes/colorUtils.ts`), ensuring full-color emojis render on every machine without requiring OS font packages.
9. Decomposed `BacklinksPanel.tsx` (183 LOC) by extracting `NotePropertiesCard.tsx` (164 LOC) and `NoteMetricsBar.tsx` (207 LOC), ensuring all modules strictly meet the 100–250 LOC requirement.

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
   - `toolbar/StyleSelectorPopover.tsx` (215 LOC): Bold, Italic, Underline, and Strikethrough popover dropdown rendered via `createPortal`.
   - `toolbar/ListFormattingGroup.tsx` (230 LOC): Bullet list, numbered list, task checklist, and list indent/outdent popover controls.
   - `toolbar/MediaSelectorPopover.tsx` (250 LOC): Media popover providing Inline Code, Code Block, Blockquote, Link / WikiLink, local Image upload, and Image URL insertion.
   - `toolbar/TableControlsGroup.tsx` (110 LOC): Insert table, add/remove row, and add/remove column buttons.
   - `toolbar/HistorySelectorPopover.tsx` (188 LOC): History popover dropdown for Undo and Redo actions rendered via `createPortal`.
   - `toolbar/EditorStatusMetrics.tsx` (113 LOC): Live word count, character count, reading time estimation, and cloud sync status badge.
   - `EditorBottomToolbar.tsx` (151 LOC): Composed toolbar layout with mouse drag-to-scroll panning, leading Copy All button, and Divider button.

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
