# Active Context: CaffeineMD

## Current State
- **Global Rebranding to CaffeineMD / Caffeine**:
  - Rebranded application name across [metadata.json](file:///home/oloty/Dev/Kite/metadata.json), [package.json](file:///home/oloty/Dev/Kite/package.json), [app/layout.tsx](file:///home/oloty/Dev/Kite/app/layout.tsx), and [README.md](file:///home/oloty/Dev/Kite/README.md).
  - Updated logo marks and emojis from kite (`🪁`) to coffee cup (`☕`).
  - Updated default seed note to `Welcome to Caffeine.md` with coffee header and links in [seedData.ts](file:///home/oloty/Dev/Kite/src/lib/storage/seedData.ts), [workspaceStore.ts](file:///home/oloty/Dev/Kite/src/stores/workspaceStore.ts), and [workspaceManager.ts](file:///home/oloty/Dev/Kite/src/lib/workspaces/workspaceManager.ts).
  - Renamed [WorkspacePopover.tsx](file:///home/oloty/Dev/Kite/src/components/workspace/WorkspacePopover.tsx) logo mark to `CaffeineLogoMark` (with backward-compatible `KiteLogoMark` export alias) and updated workspace trigger title to "CaffeineMD Workspaces".
  - Updated Google Drive sync folder naming to `CaffeineMD-${workspaceName}` with backwards-compatible search querying both `CaffeineMD` and legacy `Kite` folders.
  - Added `.caffeine-editor-content` styling in [globals.css](file:///home/oloty/Dev/Kite/app/globals.css) and updated [TiptapEditor.tsx](file:///home/oloty/Dev/Kite/src/components/editor/TiptapEditor.tsx).
  - Maintained strict 100–250 LOC module constraints across all touched files.
- **Document Metrics**: `NoteMetricsBar.tsx` (207 LOC) above `NOTE PROPERTIES` in `BacklinksPanel.tsx`. Real-time words, chars, LLM tokens, emojis (with ZWJ detection), links, and KB size via `useSyncExternalStore`.
- **Plaintext Markdown Editor Dynamic Wrapped Line Gutter Sync**: Synchronized vertical scrolling offset (`scrollTop`) between `<textarea>` and line numbers gutter in `PlaintextMarkdownEditor.tsx` with full support for soft line wrapping (`wordWrap = true` by default, with toolbar toggle). Implemented off-screen DOM mirror container with `ResizeObserver` to dynamically measure exact wrapped line heights for every logical markdown line, styling each gutter line item to match pixel-for-pixel. Bound height constraints (`h-[550px] sm:h-[680px] max-h-[calc(100vh-220px)] min-h-[350px] sm:min-h-[480px]`, `h-full`) to enable native overflow clipping and programmatic scrolling on `gutterRef.current`, with bidirectional wheel scrolling via `onWheel`.
- **Diff Viewer (Unsaved Working Copy vs. Saved Persistent Copy)**:
  - Added new `'diff'` editor mode to `EditorMode = 'rich' | 'plain' | 'diff'` in `EditorHeader.tsx`, with a dedicated `GitCompare` icon toggle button.
  - Decomposed diff logic into `diffUtils.ts` (110 LOC) and `DiffViewer.tsx` (228 LOC) adhering strictly to the 100–250 LOC requirement.
  - Implemented both Unified and Split (side-by-side) views with real-time stats (`No Unsaved Changes` vs `X line(s) modified`), additions (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`), deletions (`bg-rose-500/15 text-rose-700 dark:text-rose-300`), and dual-pane aligned scrollable grids.
  - Added immediate `Save Changes` and `Discard / Revert` action triggers in the diff micro-toolbar.
  - Enhanced `useEditorAutosave.ts` to retain the in-memory working buffer across mode switches without prematurely flushing to IndexedDB, properly updating active diffs and providing safe reverts.
- **Documentation & Presentation**: Created high-impact, badass `README.md` featuring a custom ASCII art header, product manifesto, feature pillars (local-first filesystem mounting, Tiptap v2, D3 knowledge graph, frontmatter databases, precision plaintext gutter sync, diff viewer), architecture diagram, keyboard shortcuts reference, and quickstart guides.
- **Shortcuts & Controls in Settings**:
  - Fully synchronized the "Shortcuts & Controls" section in `StorageSettingsSection.tsx` with all 8 keyboard shortcuts from `README.md` (Quick Search `⌘K` / `Ctrl+K`, Slash Commands `/`, WikiLinks `[[`, Universal Emoji Drawer `Shift+Space` / `⌘⇧Space`, Force Save `⌘S` / `Ctrl+S`, Bold `⌘B` / `Ctrl+B`, Italic `⌘I` / `Ctrl+I`, and Dismiss/Close `Esc`).
  - Added scope indicator badges (`App-wide`, `Rich Editor`, `Editor`, `Global`) and registered shortcuts counter, fully styled with theme-aware CSS variables.
  - Maintained strict module LOC constraints (232 LOC in `StorageSettingsSection.tsx`, within 100–250 LOC).
- **Editor Header & Side Toolbar Notch Decoupling**:
  - Resolved the layout notch/gap between the sidebar divider and `EditorHeader` when `toolboxPosition` is set to `'left'` or `'right'`.
  - Hoisted `<EditorHeader />` to the outer column level of `TiptapEditor.tsx`, guaranteeing 100% full-width span flush against the left sidebar border without any indentation or horizontal displacement.
  - Placed the side toolbar and document viewport in a dedicated body flex-row beneath `EditorHeader`.
  - Added `w-full shrink-0` to the root container of `EditorHeader.tsx` to maintain continuous boundary alignment.
- **Mobile Toolbar Popover Cursor & Selection Preservation**:
  - Resolved cursor jumping to EOF (`doc.content.size`) when opening the Headings toolbar popover or selecting heading/style/list options on mobile devices.
  - Implemented `savedSelectionRef` and `snapshotSelection` in `useToolbarPopover.ts`, capturing `{ from, to }` before blur can occur on touch or mousedown interactions.
  - Added `onMouseDown={(e) => e.preventDefault()}`, `onTouchStart={(e) => e.preventDefault()}`, and `onTouchEnd` handlers to trigger buttons and popover options to prevent contenteditable blur and synthetic click drops.
  - Restored precise text selection ranges before chaining formatting commands across `HeadingSelectorPopover`, `StyleSelectorPopover`, `ListFormattingGroup`, `MediaSelectorPopover`, and `HistorySelectorPopover`.
- **Refactoring Status**: All modules adhere strictly to the 100–250 LOC boundary (HeadingSelectorPopover at 179 LOC, StyleSelectorPopover at 201 LOC, ListFormattingGroup at 246 LOC, MediaSelectorPopover at 246 LOC, HistorySelectorPopover at 163 LOC, useToolbarPopover at 164 LOC, TiptapEditor at 241 LOC).

## Next Steps
- Maintain clean, decomposed component architecture.
- Verify storage and cloud sync workflows as features evolve.
