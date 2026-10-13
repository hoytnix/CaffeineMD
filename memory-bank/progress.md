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
- [x] **1-Click Netlify Direct Zip & GitHub Pages Deployment**:
  - Direct zero-build binary zip deployer to Netlify edge REST API (`https://api.netlify.com/api/v1/sites`) with note `deployMeta` persistence for single-click redeployment.
  - Direct client-side static deployer to GitHub Pages via Git Data API (Blobs -> Trees -> Commits -> `gh-pages` ref update -> Pages enablement).
  - Storage settings card with masked token inputs, test connection ping chips, and external token guide links ([DeploymentSettingsCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/DeploymentSettingsCard.tsx), [StorageSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/StorageSettingsSection.tsx)).
  - Animated deployment drawer within Export PWA dialog with live preview card, external link, and link copy button ([DeploymentActionDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/DeploymentActionDrawer.tsx), [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx)).
- [x] **Universal Glassmorphic Context Menu System**:
  - Reusable portal-based dark glassmorphic context menu with auto-collision viewport clamping and keyboard escape/outside-click listeners ([ContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/common/ContextMenu.tsx), [useContextMenu.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useContextMenu.ts)).
  - Document Tab Bar context menu with Close Tab, Close Others, Close to the Right, Close All, Pin/Unpin Tab, Duplicate to Split View (Right/Down), and Copy Path ([DocumentTabBar.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/DocumentTabBar.tsx)).
  - File Explorer context menus for files, folders, and empty canvas background ([FileNodeRow.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FileNodeRow.tsx), [FolderNode.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FolderNode.tsx), [FileActionMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileActionMenu.tsx), [FileTreeCanvasContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/tree/FileTreeCanvasContextMenu.tsx), [FileTree.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileTree.tsx)).
  - Editor Workspace context menus for rich-text Tiptap and Plaintext markdown mode with Cut/Copy/Paste, text formatting submenus, Convert to `[[WikiLink]]`, and live math expression evaluation ([EditorContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/EditorContextMenu.tsx), [PlaintextContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/PlaintextContextMenu.tsx), [TiptapEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/TiptapEditor.tsx), [PlaintextMarkdownEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/PlaintextMarkdownEditor.tsx)).
- [x] **Pyodide WASM Cold-Start & ES Module Worker Timeout Resolution**:
  - Decoupled 60-second runtime download grace window (`initTimeout`) from strict 5000ms code-execution watchdog.
  - Armed the 5000ms loop watchdog only upon receiving `execution_started` event from worker.
  - Replaced legacy scripts with official Pyodide dynamic ESM import (`https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs`).
  - Added live streaming runtime loading status banner (`Downloading Pyodide WASM runtime (~20MB)...` / `Pyodide runtime initialized`) in the editor output drawer.
  - Filtered out status events from note insertion to preserve pure stdout/result data.
  - Added `preloadPythonRuntime()` helper to pre-warm execution ([types.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/types.ts), [sandboxWorker.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/sandboxWorker.ts), [wasmSandbox.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/wasmSandbox.ts), [CodeBlockView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockView.tsx), [CodeBlockOutputDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockOutputDrawer.tsx)).
- [x] **Landing Page & Documentation Overhaul — Vibe-Coded PWA Generator & WASM Sandbox**:
  - Implemented interactive tabbed glassmorphic workspace preview in [LandingHero.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingHero.tsx) and [LandingHeroShowcase.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingHeroShowcase.tsx) supporting 3 live tabs: Live WASM Code Runner (Python data calculation via Pyodide with terminal stdout & 42ms execution pill), Vibe PWA & Deploy (packaging HUD for `_template.html` Jinja2 theme, `manifest.webmanifest`, and `sw.js` with live Netlify edge status), and Vault-Wide RegEx (multi-file line diffs with snapshot rollback chip).
  - Restructured [LandingFeatures.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingFeatures.tsx) into an asymmetric 4-pillar bento grid (`grid-cols-1 md:grid-cols-3`) highlighting Vibe-Coded PWA Generator & 1-Click Edge Publishing, Client-Side WASM Sandbox, Vault-Wide RegEx Engine, and Desktop Ergonomics & Glassmorphic GUI with dark glassmorphic cards and tag chips.
  - Expanded [LandingComparison.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingComparison.tsx) with an 8-criteria matrix comparing CaffeineMD against Obsidian, Notion, and Bear/Apple Notes with high-contrast status icons.
  - Refreshed [LandingShortcuts.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingShortcuts.tsx) with styled `<kbd>` tags covering Vault RegEx (`⌘⇧H`), WASM Runner (`⇧↵`), Split Panes (`⌘\`), PWA Drawer (`⌘E`), Quick-Switcher (`⌘P`), and Context Menu (`Right Click`).
  - Aligned [LandingMegaCTA.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingMegaCTA.tsx) with developer-centric conversion copy, primary workspace launch CTA, and sample exported PWA link.
  - Updated [README.md](file:///home/oloty/Dev/CaffeineMD/README.md) with badges for Gemini BYOK and Jinja, full feature description of Vibe-Coded PWA Generator & Vault Jinja Template Engine, and manifesto alignment.

- [x] **Gemini BYOK Jinja Theme Generator & Vault-Stored Template Engine**:
  - Zero-dependency client-side Jinja evaluator ([jinjaCompiler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/jinjaCompiler.ts)) with variables, filters (`escape`, `lower`, `upper`, `trim`), booleans, negation, equality expressions, and loops.
  - Gemini BYOK prompt generator ([geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts)) targeting `gemini-3.8-flash` with cascading fallback across `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, and `gemini-3.1-pro`.
  - Template discovery and persistence helpers ([noteRepository.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/noteRepository.ts)): `findVaultTemplate()` ascending folder hierarchies up to vault root, and `saveVaultTemplate()` persisting `_template.html` directly in IndexedDB.
  - Interactive AI Theme Studio accordion in Export PWA dialog ([AiThemePromptDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/AiThemePromptDrawer.tsx), [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx)) with presets, API key persistence, and instant workspace editing.
  - Dedicated storage settings card ([GeminiSettingsCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/GeminiSettingsCard.tsx), [StorageSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/StorageSettingsSection.tsx)) for key management and live ping testing.

- [x] **Streamlined Editor UX Controls & Relocated Vault Actions**:
  - Streamlined [EditorUxControls.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/header/EditorUxControls.tsx) down to 108 LOC retaining only Outline TOC HUD, Split View, Focus Mode, Save, and Delete buttons.
  - Relocated Code Minimap and Typewriter Mode toggles into [EditorSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/EditorSettingsSection.tsx) under a dedicated "Editor Display & Behavior" group with persistent localStorage backing in [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts).
  - Relocated Vault RegEx Find & Replace action button to the File Explorer search bar header in [FileTree.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileTree.tsx).
  - Maintained Export Document / PWA access in right-click context menus ([EditorContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/EditorContextMenu.tsx) and [FileActionMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/FileActionMenu.tsx)).

- [x] **Corrupted PWA & Standalone HTML Export Pipeline Resolution**:
  - Upgraded [frontmatter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/markdown/frontmatter.ts) to export `ParsedFrontmatterResult` returning both properties and clean body content; eliminated frontmatter header leakage (`title:`, `tags:`, `status:`, `eisenhower:`) and raw `<hr>` lines from exported document bodies.
  - Bound frontmatter metadata (`title`, `tags`, `author`, `status`) to HTML `<head>` meta tags (`author`, `keywords`, `description`) and responsive header `.meta-pills` badges.
  - Eliminated DOM duplication: audited template interpolation in [standaloneHtmlBuilder.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/standaloneHtmlBuilder.ts) to guarantee exactly one `<main>` container, normalizing `<!-- CONTENT -->`, `<!--CONTENT-->`, and `{{ content | safe }}` to `{{ content }}` while replacing inner dummy content of existing `<article>` or `<main>` elements instead of appending secondary `<main class="content">` containers.
  - Transformed WikiLinks from raw bracketed text `<span data-wikilink="...">[[Note]]</span>` into styled interactive badges `<a class="wiki-link" data-wikilink="...">` with hover underlines and background accents; added scope-aware relative remapping in [pwaExporter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/pwaExporter.ts).
  - Enforced strict typography and layout guardrails in [geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts) requiring clean sans-serif/monospace font stacks (`Inter`, system-ui, `JetBrains Mono`), `text-align: left`, and `line-height: 1.6`, while explicitly forbidding exotic serif typefaces (`Zen Old Mincho`, `Noto Serif JP`), `text-justify: inter-ideograph`, and line heights above 1.75.
  - Mandated `.wiki-link` badge styling and responsive `.editor-image` CSS across all generated themes and presets.

- [x] **Multi-Note Folder Standalone HTML & SPA Export Pipeline Resolution**:
  - Implemented folder path normalization in [exportBundleService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/exportBundleService.ts), [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx), and [pwaExporter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/pwaExporter.ts) removing breadcrumb spacing (e.g., `'Memories / 2FC' -> 'Memories/2FC'`) and trimming slashes.
  - Replaced fallback dummy placeholder document with workspace note query via `getNotesByWorkspace` in [noteRepository.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/noteRepository.ts) and path-prefix matching.
  - Implemented multi-note SPA architecture in [folderHtmlBuilder.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/folderHtmlBuilder.ts) with discrete note panes `<section id="note-${slug}" class="vault-note-pane">` and self-contained vanilla hash router in [folderHtmlStyles.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/folderHtmlStyles.ts).
  - Populated `notes` and `pages` in `TemplateContext` in [jinjaCompiler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/jinjaCompiler.ts) to render `<nav class="sidebar-nav">{% for note in notes %}<a href="#{{ note.id }}" class="sidebar-nav-link">{{ note.title }}</a>{% endfor %}</nav>`.
  - Updated theme generation prompt in [geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts) with `.sidebar-nav` and `.sidebar-nav-link` specifications and multi-note container support.
  - Enabled Standalone HTML format for folder/vault scopes in [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx) and decomposed services strictly within tiered LOC limits (<400 LOC).

- [x] **PWA & Standalone HTML Export Pipeline Overhaul (Phases 1–3)**:
  - Phase 1: Constrained JSON schema design tokens (`ThemeDesignTokens`) via Gemini `responseMimeType: 'application/json'` in [geminiTemplateGenerator.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/geminiTemplateGenerator.ts) and audited base stylesheet in [themeTokens.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/themeTokens.ts).
  - Phase 1: Local asset inlining via Base64 data URIs for Standalone HTML and `/assets/` zip extraction with Service Worker precaching for Production PWA via [assetBundler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/assetBundler.ts) and [pwaExporter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/pwaExporter.ts).
  - Phase 2: Sandboxed live preview drawer with sandboxed `<iframe>`, automatic Blob URL cleanup, and Desktop/Tablet/Mobile viewport toggles in [ExportPreviewDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPreviewDrawer.tsx).
  - Phase 2: Debounced preview HTML compilation service in [exportPreviewCompiler.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/exportPreviewCompiler.ts).
  - Phase 3: Client-side inverted search index and `⌘K` spotlight modal snippet injection in [vaultSearchIndex.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/vaultSearchIndex.ts).
  - Phase 3: Standalone 2D HTML5 Canvas knowledge graph simulator with spring physics and note pane switching in [canvasGraphHud.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/canvasGraphHud.ts) and [canvasGraphStyles.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/canvasGraphStyles.ts).
- [x] **Direct Monolithic HTML Generation Mode (Zero-Truncation AI App Synthesis & Static DOM Markup)**:
  - Created [directHtmlExporter.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/export/directHtmlExporter.ts) formatting note Markdown bodies into `=== DOCUMENT [index]: [title] ===` blocks.
  - Implemented robust Markdown pre-compilation via `parseFrontmatter()` and `markdownToHtml()` (+ `cleanWikiLinks()`) to supply clean HTML fragments into `<div class="note-body">` and strip raw YAML dividers.
  - Enforced Static DOM First architecture over JS data serialization (forbidding `const docs = [...]` string arrays that break JS parsing with unescaped backticks/quotes; mandating DOM `<div class="documents-container">` / `<article class="vault-doc-card">` / `<div class="note-body">`).
  - Bound generation to cascading fallback model sequence (`GEMINI_CANDIDATE_MODELS`: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`).
  - Enforced strict rules against content truncation, embedded CSS in `<style>`, and navigation/interaction scripts in `<script>`.
  - Added "Direct AI App Synthesis (One-Shot HTML)" toggle in [ExportOptionsForm.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportOptionsForm.tsx) and [AiThemePromptDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/AiThemePromptDrawer.tsx).
  - Wired direct preview streaming and immediate raw HTML file download in [ExportPwaModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/export/ExportPwaModal.tsx), bypassing the template pipeline.

## Verification Status
- Lint verification: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`).
- TypeScript verification: Passing cleanly with 0 errors (`tsc --noEmit`).
- Tiered LOC Limits: 100% compliant (<100 LOC sweet spot, <250 LOC soft limit, strictly <400 LOC across all modules).


