```text
      ( (
       ) )
    .______.
    |      |]    ██████╗ █████╗ ███████╗███████╗███████╗██╗███╗   ██╗███████╗███╗   ███╗██████╗ 
    \      /    ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝██║████╗  ██║██╔════╝████╗ ████║██╔══██╗
     `----'     ██║     ███████║█████╗  █████╗  █████╗  ██║██╔██╗ ██║█████╗  ██╔████╔██║██║  ██║
                ██║     ██╔══██║██╔══╝  ██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝  ██║╚██╔╝██║██║  ██║
                ╚██████╗██║  ██║██║     ██║     ███████╗██║██║ ╚████║███████╗██║ ╚═╝ ██║██████╔╝
                 ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝╚═════╝ 
```

<div align="center">

### The Local-First, High-Performance Personal Knowledge Engine ☕

*Obsidian's filesystem sovereignty meets Notion's fluid databases and block editing.*  
**Zero Cloud Lock-in. Zero Latency. 100% Privacy.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/IndexedDB-Dexie_4-green?style=for-the-badge)](https://dexie.org/)
[![Tiptap](https://img.shields.io/badge/Editor-Tiptap_v2-blueviolet?style=for-the-badge)](https://tiptap.dev/)
[![Gemini BYOK](https://img.shields.io/badge/AI_BYOK-Gemini_3.8_Flash-8e75ff?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Jinja](https://img.shields.io/badge/Template-Client_Side_Jinja2-e11d48?style=for-the-badge)](https://jinja.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Architecture](#-architecture) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack)

<br /><br />

<img src="./public/og-caffeinemd.png" alt="CaffeineMD - Lofi Girl Studying workspace illustration with coffee and code" width="100%" />

---

</div>

## ⚡ Manifesto

Modern knowledge management forced a false choice: **own raw files on disk (Obsidian)** with limited visual block interactions, or **surrender personal data to proprietary cloud silos (Notion)** for rich databases and flexible layouts.

**CaffeineMD destroys this compromise.**

Built on Next.js 15, React 19, and Dexie IndexedDB, CaffeineMD mounts real folders on local storage via the **Native File System Access API**, parses frontmatter losslessly on the fly, and supercharges personal notes with Notion-caliber Kanban boards, interactive tables, force-directed graph physics, dynamic wrapped line gutters, integrated diff management, and **vibe-coded PWA publishing & direct monolithic AI app synthesis powered by Gemini BYOK & Jinja templating**.

---

## 🚀 Key Features

### 🎨 Vibe Coding Editor & Direct AI App Synthesis
- **Direct Monolithic HTML Generation (One-Shot AI App Synthesis)**: Turn markdown notes or entire folders into production-grade, monolithic HTML applications in one shot with zero build tools. Employs a strict **Static DOM-First** architecture where note bodies are pre-compiled into clean HTML fragments with frontmatter stripped—embedding notes directly into `<div class="documents-container">` rather than serializing them into fragile JavaScript string arrays (`const docs = [...]`), completely preventing JS syntax and template string parsing crashes.
- **AI Theme Studio & Client-Side Jinja Compiler**: High-performance browser-native template engine supporting variables (`{{ title }}`, `{{ content }}`), built-in filters (`escape`, `lower`, `upper`, `trim`), booleans and equality conditionals (`{% if is_pwa %}`), and collection loops (`{% for page in pages %}`) for offline navigation drawers. Prompt Gemini via BYOK (`gemini-3.8-flash` cascading through `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`) to generate bespoke themes with constrained JSON design tokens.
- **Editable Vault `_template.html` Files**: AI-generated templates live directly in IndexedDB alongside your markdown notes. Modify CSS or layout markup directly in CaffeineMD's editor—changes immediately compile on re-export. Built-in presets include *Cyberpunk Glass*, *Zen Minimalist*, *Nordic Clean Light*, and *Obsidian High-Contrast*.
- **Sandboxed Multi-Device Live Preview Drawer**: Ephemeral sandboxed `<iframe>` preview drawer with responsive device toggles (Desktop, Tablet 768px, Mobile 375px) and debounced real-time compilation before downloading or deploying.
- **100% Offline Portability & Local Asset Inlining**: Local images and attachments in IndexedDB are automatically converted to Base64 data URIs for Standalone HTML exports, or extracted into `/assets/` with Service Worker precaching for Production PWA ZIP bundles.
- **Client-Side Knowledge Graph & Spotlight Search in Exports**: Bundled standalone exports feature an embedded 2D HTML5 Canvas knowledge graph simulator with spring physics and an inverted search index with `⌘K` / `Ctrl+K` spotlight modal.
- **1-Click Edge Distribution & Native Packaging**: Export standalone HTML documents or production PWA bundles equipped with Cache-First Service Workers (`sw.js`), PWABuilder manifests (`manifest.webmanifest`), and Capacitor mobile configurations. Deploy to Netlify Edge CDN or GitHub Pages in 1 click with zero build servers.

### 🧪 Client-Side WASM Code Sandbox & Math Scratchpad
- **In-Document Python Execution via Pyodide**: Run data science simulations, numpy array transformations, and calculations inside code blocks via in-browser Pyodide WebAssembly.
- **Isolated JS/TS Web Worker Runner**: Hijacks console streams (`stdout`, `stderr`, `result`) inside dedicated Web Workers with a strict 5000ms execution watchdog and 1-click note result injection.
- **Instant Math Evaluator**: Evaluate inline arithmetic expressions directly from the context menu or editor shortcuts.

### 🔍 Vault-Wide RegEx Engine with Snapshot Undo
- **Batch Pattern Replacement**: Refactor tags, directory paths, and YAML properties across hundreds of IndexedDB documents in milliseconds (`⌘⇧H`).
- **Atomic Commits & Per-File Checkboxes**: Review visual line diffs, toggle individual file targets, and commit replacements atomically.
- **Instant Rollback**: Revert any batch operation with 1-click snapshot history.

### 🛡️ True Local-First Sovereignty
- **Dual Ingestion**:
  - **Live Disk Mounting**: Mount native OS directories directly in the browser via `showDirectoryPicker()`. Edit local markdown files with zero intermediate uploads.
  - **Recursive Directory Drops**: Drag-and-drop entire folders (`webkitdirectory`) with deep hierarchical path reconstruction.
- **Offline Reactive Cache**: Instant state updates and offline persistence backed by **Dexie.js IndexedDB** (`useLiveQuery`).

### ✍️ Next-Gen Markdown & Block Authoring
- **Tiptap v2 Rich Text Engine**:
  - Slash Commands (`/`) for rapid block insertion (callouts, tables, headings, task lists, code blocks).
  - Bi-directional WikiLinks (`[[Note Title]]`) with live autocomplete popovers.
  - Lossless YAML Frontmatter serialization via `js-yaml`.
  - Syntax-highlighted code blocks powered by `lowlight` / `highlight.js`.
- **Configurable 4-Way Toolbox**: Dock the editor toolbar wherever focus dictates:
  - ⬅️ **Left Bar** • ➡️ **Right Bar** • ⬇️ **Floating Bottom Pill** • ⬆️ **Sticky Top Bar**
  - Viewport-clamped popover menus with smooth directional slide animations.
- **Universal Emoji System**: Quick emoji drawer on `Shift+Space`, backed by embedded Google Fonts `Noto Color Emoji` for consistent cross-platform rendering.
- **Live Document Metrics Bar**: Real-time words, characters, LLM token approximations, link counts, byte sizes, and emoji counting with ZWJ sequence detection.

### 🔍 Integrated Diff Viewer
- Seamlessly inspect unsaved working memory against persistent disk/IndexedDB copies with one click.
- **Split Side-by-Side & Unified Views**: Color-coded line additions, deletions, line counters, and modification summaries.
- **Non-Destructive Safety**: Switch between Rich, Plaintext, and Diff modes without premature writes; revert or commit changes instantaneously.

### 📐 Precision Plaintext Editor
- Full-featured raw markdown editing mode with synchronized line number gutter scrolling.
- **Dynamic Soft-Wrap Gutter Measurement**: Off-screen DOM mirror with `ResizeObserver` recalculates line heights for dynamically wrapped lines, maintaining pixel-perfect 1:1 alignment between text lines and gutter counters.

### 🕸️ Interactive D3 Knowledge Graph
- Force-directed physics simulation mapping relationships between notes.
- Automatic WikiLink graph indexing with node clustering, backlink aggregation, and unlinked mention discovery.

### 📊 Frontmatter Database Views
Turn markdown frontmatter into structured data views without cloud databases:
- **Table View**: Resizable columns, tag filters, sorting, and inline property editing.
- **Kanban Board**: Drag-and-drop cards between Status lanes and Eisenhower Matrix priority quadrants (Urgent/Important).
- **List & Tag Views**: Clean, distraction-free listings and reactive tag clouds.

### ☁️ Resumable Cloud Sync & Themes
- **Google Drive Integration**: 5MB resumable chunked multipart sync with automatic conflict and delta reconciliation.
- **14 Built-In Theme Palettes**: Modern dark, solarized, cyberpunk, monochrome, and nord modes, plus AI Theme Studio generation powered by Gemini.

---

## 🏗️ Architecture

```
                                      ┌─────────────────────────────────────┐
                                      │        Local File System / OS       │
                                      │   (Markdown Files + Frontmatter)    │
                                      └──────────────────┬──────────────────┘
                                                         │
                                    Native File System   │  webkitdirectory
                                       Access API        │  Folder Import
                                                         ▼
                                      ┌─────────────────────────────────────┐
                                      │       Dexie IndexedDB Engine        │
                                      │ (files, backlinks, tags, workspace) │
                                      └──────────────────┬──────────────────┘
                                                         │
                                             Reactive useLiveQuery
                                                         │
                                                         ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                            CAFFEINEMD CORE                                              │
 ├────────────────────────────┬─────────────────────────────┬──────────────────────────────────────────────┤
 │      Tiptap v2 Editor      │    Frontmatter Databases    │            D3 Knowledge Graph                │
 │  • Slash Command System    │  • Notion-style Tables      │  • Force-directed physics                    │
 │  • [[WikiLink]] Indexing   │  • Kanban Board & Matrix    │  • Backlink topology                         │
 │  • 4-Way Dockable Toolbox  │  • Filterable List Views    │  • Interactive link explorer                 │
 │  • Live Document Metrics   │  • Dynamic Tag Cloud        │  • Node filtering & search                   │
 ├────────────────────────────┴─────────────────────────────┴──────────────────────────────────────────────┤
 │                              Vibe Coding & Engineered Tooling Pipeline                                  │
 │  • One-Shot Monolithic HTML App Synthesis (Static DOM)   • Pyodide WASM & Web Worker Sandbox            │
 │  • Gemini BYOK Jinja Theme Studio & Vault Templates      • Vault-Wide RegEx Engine & Snapshot Undo      │
 │  • Sandboxed Multi-Device Live Preview Drawer            • 1-Click Netlify Edge & GitHub Pages Drops    │
 │  • Unified & Split Diff Viewer                           • Sub-pixel Wrapped Gutter Plaintext Editor    │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `⌘ K` / `Ctrl + K` | Global Quick Search & Command Palette | App-wide |
| `⌘ P` / `Ctrl + P` | Instant Document Quick-Switcher | App-wide |
| `⌘ E` / `Ctrl + E` | Open Quick-Export PWA & Vibe AI Drawer | App-wide |
| `⌘ ⇧ H` / `Ctrl + Shift + H` | Vault-Wide RegEx Batch Find-and-Replace | App-wide |
| `⌘ \` / `Ctrl + \` | Toggle Multi-Pane Split View | Editor |
| `F11` / `⌘ ⇧ F` | Toggle Distraction-Free Focus Mode | Editor |
| `Shift + Enter` | Execute Code Block in WASM Sandbox | Editor |
| `/` | Open Slash Block Insertion Menu | Rich Editor |
| `[[` | Trigger WikiLink Autocomplete | Rich Editor |
| `Shift + Space` | Open Universal Emoji Drawer | Rich Editor |
| `⌘ S` / `Ctrl + S` | Force Save Active Document | Editor |
| `⌘ B` / `Ctrl + B` | Toggle Bold Formatting | Editor |
| `⌘ I` / `Ctrl + I` | Toggle Italic Formatting | Editor |
| `Right Click` | Open Glassmorphic Context Menu | Files, Tabs, Editor |
| `Esc` | Close Active Popover / Dismiss Modal | Global |

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v20+ or v22+
- **pnpm**: v9+ (recommended) or npm / yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/caffeinemd.git
cd caffeinemd

# 2. Install dependencies
pnpm install

# 3. Launch the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Create optimized production build
pnpm build

# Run production server
pnpm start
```

---

## 🧰 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org/) | React Server Components, App Router, Turbopack |
| **Runtime** | [React 19](https://react.dev/) | Actions, `useSyncExternalStore`, concurrent rendering |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type checking & zero `any` tolerance |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS engine with CSS variables & `@theme` |
| **Editor** | [Tiptap v2](https://tiptap.dev/) | Headless block-based ProseMirror framework |
| **Local DB** | [Dexie.js 4](https://dexie.org/) | High-performance client-side IndexedDB wrapper |
| **Data Viz** | [D3.js (d3-force)](https://d3js.org/) | Force-directed graph topology & physics simulation |
| **State** | [Zustand 5](https://zustand.docs.pmnd.rs/) | Minimalist reactive state management |
| **Diffs** | [diff](https://github.com/kpdecker/jsdiff) | Fast character and line diff computations |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent SVG icon set |

---

## 📁 Repository Structure

```
caffeinemd/
├── memory-bank/              # Core persistent architectural memory bank
│   ├── projectbrief.md       # Foundation, scope, core pillars
│   ├── productContext.md     # Problem domain & UX goals
│   ├── systemPatterns.md     # Design patterns & constraints
│   ├── techContext.md        # Stack specs & operational guardrails
│   ├── activeContext.md      # Active focus & recent implementations
│   └── progress.md           # Completed milestones & verification
├── src/
│   ├── app/                  # Next.js App Router entrypoints & layouts
│   ├── components/           # Tiered modular UI components (100 LOC sweet spot)
│   │   ├── editor/           # Tiptap, Plaintext, DiffViewer, Toolbars
│   │   ├── database/         # Table, Kanban, List, Tag views
│   │   ├── graph/            # D3 Knowledge Graph physics renderers
│   │   ├── navigation/       # Resizable FileTree, Command Palette
│   │   └── settings/         # Toolbox positioning, Theme Studio
│   ├── hooks/                # Viewport popovers, sidebar resize, autosave
│   ├── lib/
│   │   ├── markdown/         # YAML parser, AST transformers, serializers
│   │   └── storage/          # Dexie schema, Native File System Access API
│   └── store/                # Zustand workspace stores
├── public/                   # Static assets, fonts, icons
├── package.json              # Dependencies and execution scripts
└── README.md                 # Project documentation
```

---

## 📐 Engineering Principles

1. **LOC Discipline**: Every module adheres to a tiered architecture where **100 LOC** is the sweet spot, **250 LOC** is the soft limit, and **400 LOC** is the strict hard limit. God components are systematically refactored into focused hooks, subcomponents, and barrel contracts.
2. **Lossless Markdown Serialization**: Frontmatter YAML metadata and markdown content are parsed and regenerated with absolute fidelity—never corrupting user files.
3. **Zero Cloud Requirement**: The entire core PKM operates standalone in the browser without requiring external servers or accounts. Cloud sync is strictly opt-in.
4. **Portal Popover Viewport Safety**: All floating toolbars and selectors render via `createPortal` to `document.body` with clamped viewport boundaries to eliminate overflow clipping.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">
Made with ☕ for thinkers, writers, and hackers who value privacy and craftsmanship.
</div>
