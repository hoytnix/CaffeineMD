# Active Context: CaffeineMD

## Current State
- **CaffeineMD UX Productivity Suite (All 8 Core Features Live)**:
  1. **Instant Document Quick-Switcher (`⌘P` / `Ctrl+P`)**: Modal switcher with fuzzy query matching across titles, paths, tags, and YAML aliases; full keyboard navigation (`↑`/`↓`/`Enter`/`Esc`) ([DocumentQuickSwitcherModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/search/DocumentQuickSwitcherModal.tsx)).
  2. **Auto-Heading Outline Table of Contents HUD**: Real-time heading hierarchy (H1–H6) extracted from AST and raw markdown; scroll-threshold position highlighting; smooth scroll-to-heading navigation ([DocumentOutlineHud.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/DocumentOutlineHud.tsx)).
  3. **Editor Minimap**: VS Code-style scaled overview track with micro-lines for headings, code fences, blockquotes, and lists; drag-to-scroll slider and click-to-jump navigation ([EditorMinimap.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/EditorMinimap.tsx)).
  4. **Native Markdown Table GUI Editor**: Resizable table configuration with contextual inline actions (insert row above/below, column left/right, delete row/col/table, toggle header row/col) and clipboard CSV/TSV table pasting ([TableControlsGroup.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/toolbar/TableControlsGroup.tsx)).
  5. **Direct Clipboard & File Drag-and-Drop Auto-Stager**: Zero UI freeze via instant object URLs; blob assets staged to IndexedDB via [assetRepository.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/assetRepository.ts); clean markdown roundtrips as `![alt](assets/<path>)`.
  6. **Multi-Pane Split View (Dual Editor)**: Split horizontally or vertically (`⌘\` / `Ctrl+\`); independent note selection, editor instance, scroll position, and view mode per pane ([SplitPaneContainer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/SplitPaneContainer.tsx)).
  7. **Distraction-Free Focus Mode & Typewriter Scrolling**: Focus mode hides navigation, tabs, and sidebar with floating exit pill (`F11`, `⌘⇧F`, or `Esc`); typewriter scrolling smoothly centers the active line on screen ([WorkspaceHeader.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/WorkspaceHeader.tsx), [EditorUxControls.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/header/EditorUxControls.tsx), [TiptapEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/TiptapEditor.tsx)).
  8. **Scratchpad & Frontmatter Templates (`⌘⇧N`)**: Instant templates for Quick Scratchpad, Meeting Notes, Project Spec, and Daily Journal with pre-populated YAML frontmatter metadata ([TemplateSelectorModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/TemplateSelectorModal.tsx)).
- **Architecture & Tiered LOC Compliance**: All modules decomposed within tiered LOC rules (<100 LOC sweet spot, <250 LOC soft limit, strictly <400 LOC).
- **Verification Rule**: ESLint passing with 0 errors and 0 warnings (`pnpm run lint`).

## Next Steps
- Maintain modular <100-250 LOC boundaries across all components.
- Run `pnpm run lint` verification on every turn without building.
