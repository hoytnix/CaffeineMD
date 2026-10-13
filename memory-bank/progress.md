# Progress: CaffeineMD

## Milestones
- [x] **Storage & Mounting**: Dexie IndexedDB, Native File System Access (`showDirectoryPicker`), WebKit recursive drop.
- [x] **Serialization**: Lossless YAML frontmatter parsing, bi-directional WikiLinks, HTML-Markdown image roundtrips.
- [x] **Editor Core**: Tiptap v2, ProseMirror plugins, slash commands (`/`), task lists, tables, universal emoji drawer (`Shift+Space`).
- [x] **Toolbar & Layout**: Decomposed floating pill popovers, decouple header notch, note metrics bar (words/tokens/emojis/links).
- [x] **Plaintext & Diff**: Dynamic wrapped line gutter sync, side-by-side diff viewer with unsaved state buffer.
- [x] **Databases & Graph**: Frontmatter Table view, Kanban board (Eisenhower matrix), D3 force physics knowledge graph.
- [x] **Search & Navigation**: `⌘K` fuzzy search modal, hash routing permalinks (`/w/[id]#[view]`), resizable sidebar.
- [x] **Cloud Sync & Themes**: Google Drive 5MB resumable chunk sync, 14 CSS themes, universal Noto Color Emoji font.
- [x] **Brand Consistency**: Strict user-facing `CaffeineMD` branding, seed note `Welcome to CaffeineMD.md`, canonical metadata.
- [x] **Native PWA Engine**: Service Worker (`sw.js`), 192/512px icons, native `beforeinstallprompt` prompt execution, direct editor launch.
- [x] **High-Impact Landing**: 10-component modular landing page with 6 interspersed install CTAs, live mockup, and TehWiz footer.
- [x] **SEO & JSON-LD**: Interconnected Schema.org `@graph` (WebSite, WebPage, WebApplication, Organization) on `/`.
- [x] **Lint Verification Suite**: All outstanding ESLint errors and warnings resolved; verified 0 errors and 0 warnings.
- [x] **Service Worker Network-First Upgrade**: Updated `sw.js` to `caffeinemd-v2` with Network-First strategy and cache-busting on mount to prevent stale JS from overriding Next.js multi-section landing page during hydration.
- [x] **Navbar Install Button Simplification**: Updated top navbar CTA in [LandingNav.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingNav.tsx) and [InstallButton.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/InstallButton.tsx) to display "Install".
- [x] **Vercel Analytics Integration**: Integrated `@vercel/analytics/react` directly in [app/layout.tsx](file:///home/oloty/Dev/CaffeineMD/app/layout.tsx) with clean production build verification.
- [x] **False "Unsaved" State Elimination on Note Load**: Suppressed Tiptap `onUpdate` emissions via `{ emitUpdate: false }` during content hydration and re-sync, eliminated premature code block mutations on note mount, and added saved-baseline comparison with `isContentEqual` in [useEditorAutosave.ts](file:///home/oloty/Dev/CaffeineMD/src/components/editor/hooks/useEditorAutosave.ts). Unedited notes remain clean, 0 diffs are maintained, and undoing edits reverts status cleanly to "Saved".
- [x] **CaffeineMD UX Productivity Suite (All 8 Features Implemented)**:
  1. Instant Document Quick-Switcher (`⌘P` / `Ctrl+P`) with fuzzy search and keyboard nav ([DocumentQuickSwitcherModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/search/DocumentQuickSwitcherModal.tsx)).
  2. Auto-Heading Outline Table of Contents HUD with AST hierarchy parsing & smooth viewport scroll ([DocumentOutlineHud.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/DocumentOutlineHud.tsx)).
  3. Editor Minimap with micro-line block rendering and interactive viewport slider ([EditorMinimap.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/EditorMinimap.tsx)).
  4. Native Markdown Table GUI Editor with row/col manipulation, header toggles, and clipboard CSV/TSV pasting ([TableControlsGroup.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/toolbar/TableControlsGroup.tsx)).
  5. Direct Clipboard Image & File Drop Auto-Stager with 0-latency Object URL caching and IndexedDB staging ([assetRepository.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/assetRepository.ts), [useEditorDropUpload.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useEditorDropUpload.ts)).
  6. Multi-Pane Split View Dual Editor with independent note selection, scroll, and view modes ([SplitPaneContainer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/SplitPaneContainer.tsx)).
  7. Distraction-Free Focus Mode (`F11`, `⌘⇧F`, `Esc`) and Typewriter Scrolling ([WorkspaceHeader.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/WorkspaceHeader.tsx), [EditorUxControls.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/header/EditorUxControls.tsx)).
  8. Scratchpad & Frontmatter Templates (`⌘⇧N`) for Quick Scratchpad, Meeting Notes, Project Spec, and Daily Journal ([TemplateSelectorModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/TemplateSelectorModal.tsx)).

## Verification Status
- Lint verification: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`). Enforced after every request.
- Production build: Bypassed after normal requests per user protocol (reserved for major milestones / explicit requests).
- Tiered LOC Limits: 100% compliant (<100 LOC sweet spot, <250 LOC soft limit across all landing & core modules).
