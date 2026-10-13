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
- [x] **Document Quick-Export to Production PWA & Standalone HTML**:
  - Single Note & Directory / Entire Vault export modes.
  - Standards-compliant `manifest.webmanifest`, `capacitor.config.json`, and offline Cache-First `sw.js`.
  - Zero-dependency standalone `.html` with inlined CSS custom properties and optional theme switcher.
  - Interactive UI dialog with theme selector and 1-click download ([ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx), [standaloneHtmlBuilder.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/standaloneHtmlBuilder.ts), [pwaExporter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/pwaExporter.ts)).
- [x] **Interactive Live Code Runner & Math Scratchpad (Client Sandbox)**:
  - Isolated Web Worker execution with captured console streams (`stdout`, `stderr`, `result`).
  - Python WASM execution via lazy-loaded Pyodide CDN runtime.
  - Safe math expression evaluation engine.
  - 5000ms hard timeout protection with worker termination to prevent browser freezing on infinite loops.
  - Interactive code block UI with `▶ Run` button, duration badge, terminal drawer, and "Insert into Note" button ([wasmSandbox.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/wasmSandbox.ts), [sandboxWorker.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/sandboxWorker.ts), [CodeBlockView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockView.tsx), [CodeBlockOutputDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockOutputDrawer.tsx)).
- [x] **Vault-Wide RegEx Batch Find-and-Replace (`⌘⇧H`)**:
  - Vault crawler querying Dexie IndexedDB with RegEx, Match Case, and Whole Word flags.
  - Capture group replacement support (`$1`, `$2`).
  - Checkable file tree with Select All / Deselect All controls.
  - Sequential "Replace Next Match", atomic "Replace in Checked Files", and "Replace All" batch commits.
  - Pre-mutation snapshot saving and 1-click "Undo Batch" rollback ([vaultFindReplace.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/search/vaultFindReplace.ts), [findReplaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/findReplaceStore.ts), [VaultFindReplaceModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/search/VaultFindReplaceModal.tsx), [VaultMatchFileRow.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/search/VaultMatchFileRow.tsx)).

## Verification Status
- Lint verification: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`).
- TypeScript verification: Passing cleanly with 0 errors (`tsc --noEmit`).
- Tiered LOC Limits: 100% compliant (<100 LOC sweet spot, <250 LOC soft limit across all landing & core modules).
