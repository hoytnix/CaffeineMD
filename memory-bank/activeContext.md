# Active Context: Kite MD

## Current State
- **Configurable Editor Toolbox Position (Left, Right, Bottom, Top)**:
  - Added `toolboxPosition: 'left' | 'right' | 'bottom' | 'top'` in `workspaceStore.ts` with instant `localStorage` persistence (`kite-toolbox-position`) and reactive updates.
  - Implemented `EditorSettingsSection.tsx` in `SettingsView.tsx` with 4 interactive visual placement cards featuring miniature animated editor wireframes and affirmative toasts.
  - Enhanced `EditorBottomToolbar.tsx` to dynamically support both horizontal layout (`bottom`, `top`) and vertical layout (`left`, `right`) with 2D drag scrolling and responsive mouse wheel navigation.
  - Updated `TiptapEditor.tsx` layout to dock the toolbox on the chosen side (left vertical bar, right vertical bar, sticky top bar below note header, or sticky bottom floating pill).
  - Created reusable `useToolbarPopover.ts` hook providing clamped viewport coordinates, directional animations, and dismiss events across all popovers (`StyleSelectorPopover`, `HeadingSelectorPopover`, `MediaSelectorPopover`, `HistorySelectorPopover`, `ListFormattingGroup`).
- **Editor Properties Layout**: Rearranged properties at top of editor into 3 clean rows (Row 1: Title & Author; Row 2: Status & Priority; Row 3: Tags on own line) in `EditorHeader.tsx`, hidden/collapsed by default (`isPropertiesExpanded = false`) with chevron toggle.
- **Resizable File Explorer**: Draggable border resizer (`SidebarResizer.tsx` + `useSidebarResize.ts`) on the right side of `FileTree.tsx`, supporting drag resizing (180px–720px), double-click reset (256px), keyboard accessibility, and localStorage persistence.
- **Rebranding**: Rebranded from "Kite Workspace"/"Kite" to "Kite MD" across metadata, UI, popovers, default seed notes, and workspace stores.
- **Document Metrics**: `NoteMetricsBar.tsx` (207 LOC) above `NOTE PROPERTIES` in `BacklinksPanel.tsx`. Real-time words, chars, LLM tokens, emojis (with ZWJ detection), links, and KB size via `useSyncExternalStore`.
- **Plaintext Markdown Editor Dynamic Wrapped Line Gutter Sync**: Synchronized vertical scrolling offset (`scrollTop`) between `<textarea>` and line numbers gutter in `PlaintextMarkdownEditor.tsx` with full support for soft line wrapping (`wordWrap = true` by default, with toolbar toggle). Implemented off-screen DOM mirror container with `ResizeObserver` to dynamically measure exact wrapped line heights for every logical markdown line, styling each gutter line item to match pixel-for-pixel. Bound height constraints (`h-[550px] sm:h-[680px] max-h-[calc(100vh-220px)] min-h-[350px] sm:min-h-[480px]`, `h-full`) to enable native overflow clipping and programmatic scrolling on `gutterRef.current`, with bidirectional wheel scrolling via `onWheel`.
- **Diff Viewer (Unsaved Working Copy vs. Saved Persistent Copy)**:
  - Added new `'diff'` editor mode to `EditorMode = 'rich' | 'plain' | 'diff'` in `EditorHeader.tsx`, with a dedicated `GitCompare` icon toggle button.
  - Decomposed diff logic into `diffUtils.ts` (110 LOC) and `DiffViewer.tsx` (228 LOC) adhering strictly to the 100–250 LOC requirement.
  - Implemented both Unified and Split (side-by-side) views with real-time stats (`No Unsaved Changes` vs `X line(s) modified`), additions (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`), deletions (`bg-rose-500/15 text-rose-700 dark:text-rose-300`), and dual-pane aligned scrollable grids.
  - Added immediate `Save Changes` and `Discard / Revert` action triggers in the diff micro-toolbar.
  - Enhanced `useEditorAutosave.ts` to retain the in-memory working buffer across mode switches without prematurely flushing to IndexedDB, properly updating active diffs and providing safe reverts.
- **Documentation & Presentation**: Created high-impact, badass `README.md` featuring a custom ASCII art header, product manifesto, feature pillars (local-first filesystem mounting, Tiptap v2, D3 knowledge graph, frontmatter databases, precision plaintext gutter sync, diff viewer), architecture diagram, keyboard shortcuts reference, and quickstart guides.
- **Refactoring Status**: All modules adhere strictly to the 100–250 LOC boundary (DiffViewer at 228 LOC, diffUtils at 110 LOC, TiptapEditor at 239 LOC).

## Next Steps
- Maintain clean, decomposed component architecture.
- Verify storage and cloud sync workflows as features evolve.
