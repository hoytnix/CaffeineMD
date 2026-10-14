# Progress: CaffeineMD

## Core Milestones Completed

### 1. Storage, File System & Synchronization
- [x] **Local-First Dexie.js Storage**: IndexedDB tables (`files`, `backlinks`, `tags`, `workspaces`, `settings`), soft delete & recursive trash operations.
- [x] **Dual Ingestion**: Native File System Access (`showDirectoryPicker`) + WebKit recursive folder drop.
- [x] **Google Drive Sync Engine**: 5MB resumable multipart chunking, delta reconciliation, remote file trashing & anti-resurrection guards.

### 2. Editor Core & UX Suite
- [x] **Tiptap v2 Rich Text**: Slash commands (`/`), WikiLinks (`[[`), task lists, tables, drag handles, callouts, and code blocks.
- [x] **Multi-Mode Markdown**: Rich text, Plaintext gutter line sync, and side-by-side Diff view.
- [x] **Productivity Suite**: Document Quick-Switcher (`⌘P`), Outline TOC HUD, Editor Minimap, Table GUI editor, Smart Paste engine, Multi-pane split view (`⌘\`), Distraction-free Focus mode (`F11`), and Typewriter scrolling.
- [x] **Lossless YAML Frontmatter**: Frontmatter metadata inspector and roundtrip AST serialization via `js-yaml`.

### 3. Client-Side WASM Code Sandbox
- [x] **Multi-Language Runner Engine**: Isolated Web Worker with captured stdout/stderr and 5000ms watchdog.
- [x] **Supported Runtimes**: Python (Pyodide WASM + auto package install), JS/TS (transpiler + AsyncFunction), SQLite (`sql.js`), Lua (Fengari 5.3), POSIX Shell, JSON/HTML preview iframe, and Compiler Explorer (Rust/Go/C/C++).
- [x] **Interactive CodeBlock UI**: Language dropdown, run status, duration pills, output drawer, and insert-into-note actions.

### 4. Knowledge Graph & Database Views
- [x] **Bi-directional Knowledge Graph**: D3 force physics simulator, 2D HTML5 canvas renderer, zoom/pan controls, and theme palette adaptation.
- [x] **Frontmatter Databases**: Notion-style Table, Kanban board (Eisenhower matrix), List view, and Tag Cloud view.
- [x] **Backlinks & Unlinked Mentions**: Real-time reference indexing and collapsible mentions panel.

### 5. Export, Synthesis & Cloud Deployment
- [x] **Production PWA & Standalone HTML**: Offline Service Worker, app manifest, local asset Base64 inlining, and sandboxed live preview drawer.
- [x] **AI Synthesis & Themes**: Zero-truncation Direct Monolithic HTML generation, Jinja2 template compiler, and Gemini BYOK theme generator.
- [x] **1-Click Edge Deployment**: Zero-build binary zip deployer to Netlify edge and static deployer to GitHub Pages (`gh-pages`).

### 6. iOS Settings App & Custom Themes
- [x] **iOS Settings Experience**: Root home screen with Account Card ("Michael Hoyt"), 5 squircle category rows, and sticky horizontal tab bar.
- [x] **Theme Studio**: 14 handcrafted presets, AI Theme Studio (Gemini BYOK), Custom Theme Palette & Backdrop Wizard, and theme variables propagation.
- [x] **Customizable Keyboard Shortcuts**: Key combo recorder, conflict detection, and global accelerator dispatch.

## Verification Status
- Production Build: Passing cleanly (`pnpm run build`).
- ESLint: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`).
- TypeScript: Passing cleanly (`tsc --noEmit`).
- Tiered LOC Limits: 100% compliant (<200 LOC per file across all settings modules).
