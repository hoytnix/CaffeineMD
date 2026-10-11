# Active Context: Kite MD

## Current State
- **Editor Properties Layout**: Rearranged properties at top of editor into 3 clean rows (Row 1: Title & Author; Row 2: Status & Priority; Row 3: Tags on own line) in `EditorHeader.tsx`, hidden/collapsed by default (`isPropertiesExpanded = false`) with chevron toggle.
- **Resizable File Explorer**: Draggable border resizer (`SidebarResizer.tsx` + `useSidebarResize.ts`) on the right side of `FileTree.tsx`, supporting drag resizing (180px–720px), double-click reset (256px), keyboard accessibility, and localStorage persistence.
- **Rebranding**: Rebranded from "Kite Workspace"/"Kite" to "Kite MD" across metadata, UI, popovers, default seed notes, and workspace stores.
- **Document Metrics**: `NoteMetricsBar.tsx` (207 LOC) above `NOTE PROPERTIES` in `BacklinksPanel.tsx`. Real-time words, chars, LLM tokens, emojis (with ZWJ detection), links, and KB size via `useSyncExternalStore`.
- **Mobile Spacing & Prose Margins Optimization**: Fixed excessive vertical whitespace between note title and body content on mobile screens. Replaced static editor wrapper padding (`px-10 py-10`) with responsive utilities (`px-4 pt-2 sm:pt-4 md:pt-6 pb-8 sm:px-6 md:px-10`), reduced title bottom margin on mobile (`mb-2 sm:mb-4 md:mb-6`), collapsed first-child margins inside ProseMirror/Tiptap (`[&>*:first-child]:mt-0`), made plaintext editor responsive (`space-y-2 sm:space-y-4`), and added zero-overhead collapsible states to `NotePropertiesCard.tsx` (`mb-2 sm:mb-3` on mobile).
- **Refactoring Status**: All modules adhere strictly to the 100–250 LOC boundary.

## Next Steps
- Maintain clean, decomposed component architecture.
- Verify storage and cloud sync workflows as features evolve.
