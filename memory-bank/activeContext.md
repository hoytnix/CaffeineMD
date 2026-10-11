# Active Context: Kite MD

## Current State
- **Editor Properties Layout**: Rearranged properties at top of editor into 3 clean rows (Row 1: Title & Author; Row 2: Status & Priority; Row 3: Tags on own line) in `EditorHeader.tsx`, hidden/collapsed by default (`isPropertiesExpanded = false`) with chevron toggle.
- **Resizable File Explorer**: Draggable border resizer (`SidebarResizer.tsx` + `useSidebarResize.ts`) on the right side of `FileTree.tsx`, supporting drag resizing (180px–720px), double-click reset (256px), keyboard accessibility, and localStorage persistence.
- **Rebranding**: Rebranded from "Kite Workspace"/"Kite" to "Kite MD" across metadata, UI, popovers, default seed notes, and workspace stores.
- **Document Metrics**: `NoteMetricsBar.tsx` (207 LOC) above `NOTE PROPERTIES` in `BacklinksPanel.tsx`. Real-time words, chars, LLM tokens, emojis (with ZWJ detection), links, and KB size via `useSyncExternalStore`.
- **Refactoring Status**: All modules adhere strictly to the 100–250 LOC boundary.

## Next Steps
- Maintain clean, decomposed component architecture.
- Verify storage and cloud sync workflows as features evolve.
