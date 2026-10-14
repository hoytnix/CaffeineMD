# Progress: CaffeineMD

## Core Milestones Completed

### 1. Storage, File System & Synchronization
- [x] **Local-First Dexie.js Storage**: IndexedDB tables (`files`, `backlinks`, `tags`, `workspaces`, `settings`), soft delete & recursive trash operations.
- [x] **Dual Ingestion**: Native File System Access (`showDirectoryPicker`) + WebKit recursive folder drop.
- [x] **Google Drive Sync Engine**: 5MB resumable multipart chunking, delta reconciliation, remote file trashing & anti-resurrection guards.
- [x] **Google Drive Persistence & Auto-Sync**: Offline consent token issuance, persistent localStorage rehydration, and automatic debounced sync on note save.
- [x] **Comprehensive CRUD Auto-Sync**: Immediate debounced sync triggering across Create, Update, Move, Rename, and Trash/Delete operations for both notes and folders.
- [x] **Nested Sub-Directory Movement & Isolated Drag-and-Drop**: Recursively aggregated folder path collection, breadcrumb path selection, isolated folder header drop targeting with bubbling cancellation, multi-segment path normalization, and automatic ancestor folder expansion on move.

### 2. Editor Core & UX Suite
- [x] **Tiptap v2 Rich Text**: Slash commands (`/`), WikiLinks (`[[`), task lists, tables, drag handles, callouts, and code blocks.
- [x] **Multi-Mode Markdown**: Rich text, Plaintext gutter line sync, and side-by-side Diff view.
- [x] **Productivity Suite**: Document Quick-Switcher (`⌘P`), Outline TOC HUD, Editor Minimap, Table GUI editor, Smart Paste engine, Multi-pane split view (`⌘\`), Distraction-free Focus mode (`F11`), and Typewriter scrolling.
- [x] **Lossless YAML Frontmatter**: Frontmatter metadata inspector and roundtrip AST serialization via `js-yaml`.

### 3. Client-Side WASM Code Sandbox
- [x] **Multi-Language Runner Engine**: Isolated Web Worker with captured stdout/stderr and 5000ms watchdog.
- [x] **Supported Runtimes**: Python (Pyodide WASM + auto package install), JS/TS (transpiler + AsyncFunction), SQLite (`sql.js`), Lua (Fengari 5.3), POSIX Shell, JSON/HTML preview iframe, and Compiler Explorer (Rust/Go/C/C++).
- [x] **Interactive CodeBlock UI**: Language dropdown, run status, duration pills, output drawer, and insert-into-note actions.
- [x] **Instant Startup Sandbox Setting & One-Time Caching**: `codeExecutionSandboxEnabled` store state defaulting to `false` for instant initial launch, settings toggle card placed right after Editor Display & Behavior, browser Cache API integration (`fetchWithRuntimeCache()`), and automatic dismissal of transient compiler downloading messages.

### 4. Knowledge Graph & Database Views
- [x] **Bi-directional Knowledge Graph**: D3 force physics simulator, 2D HTML5 canvas renderer, zoom/pan controls, and theme palette adaptation.
- [x] **Frontmatter Databases**: Notion-style Table, Kanban board (Eisenhower matrix), List view, and Tag Cloud view.
- [x] **Database Space-Saving UI**: Collapsible filter spoiler, active count badge, compact switcher, and stripped redundant top header block.
- [x] **Backlinks & Unlinked Mentions**: Real-time reference indexing and collapsible mentions panel.

### 5. Export, Synthesis & Cloud Deployment
- [x] **Production PWA & Standalone HTML**: Offline Service Worker, app manifest, local asset Base64 inlining, and sandboxed live preview drawer.
- [x] **AI Synthesis & Themes**: Zero-truncation Direct Monolithic HTML generation, Jinja2 template compiler, and Gemini BYOK theme generator.
- [x] **1-Click Edge Deployment**: Zero-build binary zip deployer to Netlify edge and static deployer to GitHub Pages (`gh-pages`).

### 6. iOS Settings App & Custom Themes
- [x] **iOS Settings Experience**: Root home screen with dynamic SSO Profile Card, 5 squircle category rows, and sticky horizontal tab bar.
- [x] **Theme Studio**: 14 handcrafted presets, AI Theme Studio (Gemini BYOK), Custom Theme Palette & Backdrop Wizard, and theme variables propagation.
- [x] **Adjustable Theme Opacity**: Added 10%–100% theme background opacity slider in Theme Settings Section, dynamically tuning ambient background image opacity across all views.
- [x] **Ambient Theme Background Image Layer Isolation**: Rendered backdrop image layers across Workspace, Settings, Split Pane, Editor, Diff, Plaintext, Database, Graph, and Tags views, with mobile-safe `background-attachment: scroll`, keeping cards, buttons, modals, and toolbars completely solid.
- [x] **External Link Tap/Click Preview**: Configured `@tiptap/extension-link` with `openOnClick: false` and `target: null` to suppress native iOS WebKit link navigation. Intercepted `click` and `touchend` events in capture phase (`{ capture: true }`) with touch scroll rejection, pinned previews opened via click/tap against mouseout, provided 280ms hover preview on desktop, and kept the "Open" button navigating in a new tab (`target="_blank"`).
- [x] **Production Maintainer Documentation Suite**: Authored 8 production-grade maintainer documentation files inside `/docs`.
- [x] **Branding & Responsive UX**: "A TehWiz Production." link in settings footer, touch/mobile close file tab accessibility, and root welcome note seeding.
- [x] **Customizable Keyboard Shortcuts**: Key combo recorder, conflict detection, and global accelerator dispatch.

### 7. Strategic Modular Refactoring (100–250 LOC Target)
- [x] **1. Emoji Dataset Deconstruction**: Split `emojiData.ts` (184 LOC) and `emojiObjectsSymbols.ts` (75 LOC).
- [x] **2. Zustand God-Store Slicing**: Sliced `workspaceStore.ts` (197 LOC) into `tabsSlice.ts` (174 LOC), `themeStorageSlice.ts` (229 LOC), `themeStorageUtils.ts` (85 LOC), `trashSlice.ts` (191 LOC), and `uiOverlaySlice.ts` (131 LOC).
- [x] **3. Editor Host Decomposition**: Refactored `TiptapEditor.tsx` (249 LOC) by extracting `EditorBody.tsx` (153 LOC) and `EditorOverlays.tsx` (56 LOC).
- [x] **4. Settings View & Hook Extraction**: Refactored `SettingsView.tsx` (125 LOC) by extracting `useSettingsState.ts` (93 LOC).
- [x] **5. Workspace Creation Separation**: Refactored `CreateWorkspaceModal.tsx` (143 LOC) by extracting `useCreateWorkspace.ts` (137 LOC) and `WorkspaceStorageSelector.tsx` (143 LOC).
- [x] **6. Tag Cloud Modularization**: Refactored `TagCloudView.tsx` (134 LOC) by extracting `TagCloudHeader.tsx` (114 LOC), `TagNoteCard.tsx` (110 LOC), and `excerpt.ts` (44 LOC).
- [x] **7. Global CSS Decomposition**: Modularized `globals.css` (150 LOC) by extracting `prosemirror.css` (191 LOC), `editor-lists.css` (140 LOC), and `syntax.css` (133 LOC).

### 8. Architectural Consolidation & 7-Vector Next.js DRY Audit (Phases 1 & 3)
- [x] **Leaf Type, Hook & Storage Consolidation (`DRY-07`, `DRY-08`, `DRY-09`)**: Consolidated root `lib/utils.ts` and `hooks/use-mobile.ts` into canonical `src/lib/utils.ts` and `src/hooks/use-mobile.ts`; merged sandbox runner types into `src/lib/sandbox/types.ts`; created canonical `src/lib/config/storageRegistry.ts`.
- [x] **Client Interaction Hooks (`DRY-03`, `DRY-06`)**: Extracted `usePointerResize.ts` for unified pointer drag resizing across sidebars and table columns; created `useFloatingDismiss` in `useContextMenu.ts` for unified viewport boundary clamping and outside dismissal.
- [x] **UI Shell Primitives (`DRY-01`)**: Created `ModalShell.tsx` and migrated all 9 modal dialogs, eliminating duplicate portal overlays, escape key listeners, and custom close buttons; removed redundant `FileModals.tsx`.
- [x] **Gemini AI Service & Route Handler Unification (`DRY-04`)**: Created `src/lib/ai/geminiClient.ts` with structured generation, model fallback cascading, and markdown fence stripping across `/api/theme/generate`, `aiThemeService.ts`, and `geminiTemplateGenerator.ts`.
- [x] **Export Pre-Compiler & Vault Mutation DAL (`DRY-02`, `DRY-05`)**: Added `compileVaultExportContext()` to `exportBundleService.ts`; created `vaultMutationService.ts` unifying mutations, disk synchronization, and background Google Drive auto-sync.

## Verification Status
- Production Build: Passing cleanly.
- ESLint: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`).
- TypeScript: Passing cleanly with 0 errors (`tsc --noEmit`).
- Tiered LOC Limits: 100% compliant (<250 LOC per file across all touched modules, <400 hard limit).
