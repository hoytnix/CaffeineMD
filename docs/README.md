# CaffeineMD Maintainer Documentation Suite

Welcome to the official maintainer and engineering documentation for **CaffeineMD** — the high-performance, local-first personal knowledge management (PKM) engine and block-authoring studio.

---

## 1. System Overview

CaffeineMD dismantles the historic compromise between file-ownership PKMs (like Obsidian) and visual cloud-silo block databases (like Notion). It bridges raw filesystem ownership with structured multi-modal views, rich block authoring, and edge-deployable application synthesis:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          CAFFEINEMD PKM                                          │
├──────────────────────────┬──────────────────────────┬────────────────────────────────────────────┤
│     Local-First Core     │    Rich Visual Layer     │          Edge App & Synthesis              │
│  • File System Access    │  • Tiptap WYSIWYG        │  • One-Shot Monolithic HTML Exporter       │
│  • Dexie.js (IndexedDB)  │  • Plaintext Line Gutter │  • Client-Side Jinja2 Compiler             │
│  • Google Drive Anti-    │  • Side-by-Side Diffs    │  • Gemini BYOK AI Theme Studio             │
│    Resurrection Sync     │  • Notion-style Tables   │  • Polyglot WASM Sandbox (Python, SQLite,  │
│  • MiniSearch Fuzzy      │  • Kanban & Eisenhower   │    JS/TS, Lua, Bash, Godbolt Compilers)    │
│  • Vault-Wide RegEx      │  • 2D D3 Force Graph     │  • 1-Click Netlify & GitHub Pages Drop     │
└──────────────────────────┴──────────────────────────┴────────────────────────────────────────────┘
```

- **Local-First Sovereignty**: Direct OS filesystem directory mounting (`showDirectoryPicker`) and deep folder drops (`webkitdirectory`) backed by an offline-first reactive IndexedDB cache (`Dexie.js`).
- **Tri-Mode Markdown Engine**: Seamless switching between WYSIWYG rich text, sub-pixel soft-wrapped line-gutter plaintext, and side-by-side git-style diff inspection.
- **Frontmatter Relational Databases**: Instant transformations of YAML frontmatter metadata into interactive, filterable, resizable Notion-style Tables, Kanban boards, and tag taxonomies.
- **Bi-Directional Topology**: 2D HTML5 canvas force-directed graph simulator mapping WikiLink topologies, backlinks, and unlinked entity references.
- **Polyglot Client-Side WASM Sandbox**: Sandboxed in-browser code execution for Python (Pyodide), SQLite (`sql.js`), Lua (Fengari), TypeScript/JavaScript, POSIX Shell, and compiled languages via Web Workers and browser Cache Storage.
- **Production PWA & Monolithic App Synthesis**: Client-side Jinja2 template compilation and Gemini AI BYOK synthesis exporting self-contained HTML applications or offline PWA bundles.

---

## 2. Tech Stack Architecture

| Layer | Primary Technology | Version / Spec | Purpose & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | 15.5+ (App Router) | React Server Components, Turbopack, route handlers for theme synthesis |
| **Runtime** | [React](https://react.dev/) | 19.0+ | Concurrent rendering, `useActionState`, `useSyncExternalStore` |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.9+ | Strict type soundness, zero-`any` policy, explicit domain schemas |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | v4.0+ | Modern `@theme` tokens, dynamic CSS variable cascading, fluid glass UI |
| **Editor Core** | [Tiptap](https://tiptap.dev/) / ProseMirror | v2.11+ / Core | Headless extensible block editor with keyed plugin suggestion handlers |
| **Local Storage** | [Dexie.js](https://dexie.org/) | 4.0+ | IndexedDB object store wrapper with `dexie-react-hooks` (`useLiveQuery`) |
| **Full-Text Search** | [MiniSearch](https://github.com/lucaong/minisearch) | 7.1+ | In-memory tokenized fuzzy indexing for instant `⌘K` spotlight lookups |
| **Global State** | [Zustand](https://github.com/pmndrs/zustand) | 5.0+ | Unidirectional workspace, split-pane, search, and modal lifecycle stores |
| **Cloud Sync** | Google Drive REST API v3 | Multipart Resumable | 5MB resumable chunked transport with anti-resurrection delta reconciliation |
| **Graph Physics** | [D3.js (d3-force)](https://d3js.org/) | 3.0+ | 2D velocity-Verlet physical simulation rendered directly to HTML5 Canvas |
| **WASM Runtimes** | Pyodide, SQL.js, Fengari | Browser Cache API | WebAssembly sandbox engine running in dedicated Web Workers |
| **Icons & Media** | [Lucide React](https://lucide.dev/) | Latest | Crisp SVG iconography with tree-shaken ESM imports |

---

## 3. Directory Map

The CaffeineMD codebase maintains a strict modular structure adhering to the tiered LOC discipline (<250 lines per file):

```text
caffeinemd/
├── app/                                # Next.js 15 App Router Entrypoints
│   ├── api/theme/generate/route.ts     # Gemini BYOK serverless theme generation endpoint
│   ├── globals.css                     # Tailwind v4 theme definitions & ambient opacity rules
│   ├── layout.tsx                      # Root HTML layout with universal emoji font loading
│   ├── page.tsx                        # Landing page route with quick-launch vault controls
│   ├── settings/page.tsx               # Dedicated iOS-inspired settings application route
│   └── w/[workspaceId]/page.tsx        # Core workspace studio route (Editor, Graph, DB, Tags)
│
├── src/
│   ├── components/                     # Modular React Components (Strict LOC Compliance)
│   │   ├── common/                     # Shared UI primitives (Buttons, Tooltips, Modals)
│   │   ├── database/                   # Frontmatter database views (Table, Kanban, List)
│   │   │   ├── kanban/                 # Kanban lanes, cards, and drag-and-drop mechanics
│   │   │   ├── table/                  # Resizable columns, filters, and property cells
│   │   │   └── toolbar/                # Database switcher, filter spoilers, property counts
│   │   ├── editor/                     # Tri-mode editor suite
│   │   │   ├── components/             # Minimap, Outline HUD, Link Preview, Properties Card
│   │   │   ├── config/                 # Tiptap extensions, DOM handlers, markdown parsers
│   │   │   ├── extensions/             # Custom WikiLink, SlashCommand, CodeBlockView
│   │   │   ├── header/                 # Document tabs, breadcrumbs, window controls
│   │   │   ├── hooks/                  # Tiptap initialization, autosave, suggestions
│   │   │   ├── menus/                  # Floating slash and WikiLink autocomplete portals
│   │   │   ├── modes/                  # Plaintext with gutter wrap, side-by-side DiffViewer
│   │   │   └── toolbar/                # 4-way dockable editor toolbars and sub-menus
│   │   ├── emoji/                      # Universal emoji picker with Noto Color Emoji font
│   │   ├── export/                     # PWA/HTML export dialogs, live iframe preview drawer
│   │   ├── graph/                      # D3 force-directed knowledge graph canvas and HUD
│   │   ├── landing/                    # Welcome hero, demo workspaces, vault import dropzone
│   │   ├── search/                     # ⌘K quick switcher, vault-wide RegEx Find & Replace
│   │   ├── settings/                   # iOS-inspired settings app views and category rows
│   │   │   └── sections/               # Storage, Themes, Shortcuts, Sandbox, Google Drive
│   │   ├── sidebar/                    # Resizable vault file tree, context menus, action modals
│   │   └── workspace/                  # Split-pane container, status bars, workspace switchers
│   │
│   ├── hooks/                          # Reusable Application Hooks
│   │   ├── useContextMenu.ts           # Clamped glassmorphic context menu coordinates
│   │   ├── useDatabaseSchema.ts        # Dynamic frontmatter column extraction and types
│   │   ├── useEditorDropUpload.ts      # Drag-and-drop image and asset insertion
│   │   ├── useGraphData.ts             # Reactive node/edge topology extractor from Dexie
│   │   ├── useKeyboardOffset.ts        # Mobile virtual keyboard viewport adaptation
│   │   ├── useNotePersistence.ts       # Debounced save, frontmatter migration, auto-sync
│   │   ├── useVaultMounting.ts         # Native File System Access API directory handle broker
│   │   └── useWorkspaceRouter.ts       # Hash-based view switching & URL parameter sync
│   │
│   ├── lib/                            # Pure TypeScript Business Logic & Utilities
│   │   ├── export/                     # Standalone HTML, Jinja compiler, PWA bundler, deployers
│   │   ├── graph/                      # D3 simulation math, canvas renderers, node shaders
│   │   ├── markdown/                   # Lossless YAML frontmatter, HTML/MD bidirectional parser
│   │   ├── sandbox/                    # WASM worker singleton, language runners, Cache API
│   │   ├── search/                     # Vault-wide RegEx engine, MiniSearch indexers
│   │   ├── shortcuts/                  # Global accelerator dispatch & key combination recorder
│   │   ├── storage/                    # Dexie database schema, native file crawler, seed data
│   │   │   └── repositories/           # Note, asset, workspace, and trash CRUD operations
│   │   ├── sync/                       # Google Drive resumable uploader, reconciler, delta engine
│   │   └── themes/                     # Theme palettes, AI theme generator, CSS var applier
│   │
│   └── stores/                         # Reactive State Management
│       ├── findReplaceStore.ts         # Vault find/replace state, match indexes, batch diffs
│       └── workspaceStore.ts           # Central state: tabs, split panes, views, theme, sandbox
│
├── public/                             # Static Assets, PWA Icons, Worker Scripts
├── memory-bank/                        # Persistent Architect Memory Bank
│   ├── activeContext.md                # Active stream of work & recent design decisions
│   ├── productContext.md               # User problem domain & operational workflows
│   ├── progress.md                     # Completed milestones & build verification matrix
│   ├── projectbrief.md                 # Core foundations, scope, and technical pillars
│   ├── systemPatterns.md               # Strict architecture guidelines & LOC limits
│   └── techContext.md                  # Detailed environment constraints & dependencies
├── .env.example                        # Environment template for local secrets
├── package.json                        # Scripts and npm dependencies
└── tsconfig.json                       # Strict TypeScript compiler configuration
```

---

## 4. Local Development & Build Commands

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended).
- **pnpm**: `v9.x+` (strictly recommended for deterministic lockfile resolution).

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-username/caffeinemd.git
cd caffeinemd

# Install dependencies cleanly
pnpm install

# Copy environment configuration
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)
Configure the following keys in `.env.local` if utilizing external AI or hosting features:
```env
# Optional: Required for Gemini BYOK AI Theme Studio & App Synthesis
GEMINI_API_KEY="AIzaSy..."

# Optional: Base URL for OAuth redirect URLs and external deployment callbacks
APP_URL="http://localhost:3000"
```

### Common Developer Commands

```bash
# Start local development server with Turbopack
pnpm dev

# Run strict ESLint verification across entire codebase
pnpm run lint

# Run standalone TypeScript compiler check (Zero errors allowed)
pnpm exec tsc --noEmit

# Compile production-optimized static & serverless bundle
pnpm run build

# Start production server locally to test output
pnpm start
```

### Static & Serverless Deployment Considerations

1. **Local-First & Client-Heavy Architecture**:
   - The majority of CaffeineMD runs client-side inside the user's browser (IndexedDB, WebAssembly workers, Tiptap, Canvas Graph).
   - Server components and route handlers are minimal (e.g., `/api/theme/generate`), making the app trivial to host on Vercel, Netlify, or Docker containers.

2. **Web Worker & Cross-Origin Isolation**:
   - The WASM code execution sandbox runs in dedicated Web Workers (`sandboxWorker.ts`).
   - When deploying to Netlify or Vercel, static headers must allow worker instantiation without restrictive CSP blocks against `blob:` or `data:` URIs.

3. **Google Drive OAuth Callbacks**:
   - Ensure the deployment domain (e.g., `https://caffeinemd.app`) is registered in Google Cloud Console under **Authorized JavaScript Origins** and **Authorized Redirect URIs** for Google Drive REST API access.

---

## 5. Documentation Suite Navigation

Explore the specialized architectural documents in this suite for deep implementation guidance:

| Document | Primary Focus | Key Modules Covered |
| :--- | :--- | :--- |
| **[Architecture & State Management](./architecture-and-state.md)** | Routing, App Shell, Zustand stores, LOC guardrails | `app/w/[workspaceId]`, `workspaceStore.ts`, `useWorkspaceRouter.ts` |
| **[Storage, Indexing & Cloud Sync](./storage-and-sync.md)** | Dexie IndexedDB, File System Access API, MiniSearch, Google Drive Sync | `db.ts`, `schema.ts`, `noteRepository.ts`, `googleDriveSync.ts` |
| **[Editor, Modes & Markdown](./editor-and-markdown.md)** | Tiptap extensions, Plaintext gutter wrap, DiffViewer, YAML Frontmatter | `TiptapEditor.tsx`, `useTiptapInit.ts`, `IosLinkPreviewCard.tsx`, `frontmatter.ts` |
| **[Polyglot WASM Code Sandbox](./sandbox-and-code-runner.md)** | Web Worker execution, Browser Cache API, Pyodide, SQLite, Lua, Bash | `wasmSandbox.ts`, `runtimeCache.ts`, `CodeExecutionSandboxSection.tsx` |
| **[Themes, CSS Tokens & Mobile UX](./themes-and-ui-system.md)** | CSS variable tokens, opacity isolation, iOS Safari ergonomics | `globals.css`, `colorUtils.ts`, `IosSettingsHome.tsx`, `useKeyboardOffset.ts` |
| **[Databases, Graph & PWA Exporter](./database-graph-and-export.md)** | Table/Kanban databases, D3 Canvas Graph, One-Shot Monolithic HTML | `TableView.tsx`, `physicsSimulation.ts`, `pwaExporter.ts`, `standaloneHtmlBuilder.ts` |
| **[Maintenance & Troubleshooting](./maintenance-and-troubleshooting.md)** | Developer recipes, known pitfalls, regression prevention, DB migrations | `shortcutManager.ts`, Link tap handling, theme opacity rules |
