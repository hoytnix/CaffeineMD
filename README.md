```text
       /\
      /  \
     / /\ \
    / /  \ \
   /_/____\_\
       ||
       ||      ██╗  ██╗██╗████████╗███████╗    ███╗   ███╗██████╗ 
       ||      ██║ ██╔╝██║╚══██╔══╝██╔════╝    ████╗ ████║██╔══██╗
       ||      █████╔╝ ██║   ██║   █████╗      ██╔████╔██║██║  ██║
      /  \     ██╔═██╗ ██║   ██║   ██╔══╝      ██║╚██╔╝██║██║  ██║
     ~    ~    ██║  ██╗██║   ██║   ███████╗    ██║ ╚═╝ ██║██████╔╝
    ~      ~   ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝╚═════╝ 
```

<div align="center">

### The Local-First, High-Performance Personal Knowledge Engine 🪁

*Obsidian's filesystem sovereignty meets Notion's fluid databases and block editing.*  
**Zero Cloud Lock-in. Zero Latency. 100% Privacy.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/IndexedDB-Dexie_4-green?style=for-the-badge)](https://dexie.org/)
[![Tiptap](https://img.shields.io/badge/Editor-Tiptap_v2-blueviolet?style=for-the-badge)](https://tiptap.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Architecture](#-architecture) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack)

---

</div>

## ⚡ Manifesto

Modern knowledge management forced a false choice: **own raw files on disk (Obsidian)** with limited visual block interactions, or **surrender personal data to proprietary cloud silos (Notion)** for rich databases and flexible layouts.

**Kite MD destroys this compromise.**

Built on Next.js 15, React 19, and Dexie IndexedDB, Kite MD mounts real folders on local storage via the **Native File System Access API**, parses frontmatter losslessly on the fly, and supercharges personal notes with Notion-caliber Kanban boards, interactive tables, force-directed graph physics, dynamic wrapped line gutters, and integrated diff management.

---

## 🚀 Key Features

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
 │                                              KITE MD CORE                                               │
 ├────────────────────────────┬─────────────────────────────┬──────────────────────────────────────────────┤
 │      Tiptap v2 Editor      │    Frontmatter Databases    │            D3 Knowledge Graph                │
 │  • Slash Command System    │  • Notion-style Tables      │  • Force-directed physics                    │
 │  • [[WikiLink]] Indexing   │  • Kanban Board & Matrix    │  • Backlink topology                         │
 │  • 4-Way Dockable Toolbox  │  • Filterable List Views    │  • Interactive link explorer                 │
 │  • Live Document Metrics   │  • Dynamic Tag Cloud        │  • Node filtering & search                   │
 ├────────────────────────────┴─────────────────────────────┴──────────────────────────────────────────────┤
 │                                      Engineered Tooling & Utilities                                     │
 │  • Unified & Split Diff Viewer           • Sub-pixel Wrapped Gutter Plaintext Editor                    │
 │  • Google Drive Resumable Sync           • Gemini AI-Powered Theme Studio                               │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `⌘ K` / `Ctrl + K` | Global Quick Search & Command Palette | App-wide |
| `/` | Open Slash Block Insertion Menu | Rich Editor |
| `[[` | Trigger WikiLink Autocomplete | Rich Editor |
| `Shift + Space` | Open Universal Emoji Drawer | Rich Editor |
| `⌘ S` / `Ctrl + S` | Force Save Active Document | Editor |
| `⌘ B` / `Ctrl + B` | Toggle Bold Formatting | Editor |
| `⌘ I` / `Ctrl + I` | Toggle Italic Formatting | Editor |
| `Esc` | Close Active Popover / Dismiss Modal | Global |

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v20+ or v22+
- **pnpm**: v9+ (recommended) or npm / yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/kite-md.git
cd kite-md

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
kite-md/
├── memory-bank/              # Core persistent architectural memory bank
│   ├── projectbrief.md       # Foundation, scope, core pillars
│   ├── productContext.md     # Problem domain & UX goals
│   ├── systemPatterns.md     # Design patterns & constraints
│   ├── techContext.md        # Stack specs & operational guardrails
│   ├── activeContext.md      # Active focus & recent implementations
│   └── progress.md           # Completed milestones & verification
├── src/
│   ├── app/                  # Next.js App Router entrypoints & layouts
│   ├── components/           # 100-250 LOC decomposed UI components
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

1. **LOC Discipline**: Every module adheres to a strict **100–250 LOC boundary**. God components are systematically refactored into focused hooks, subcomponents, and barrel contracts.
2. **Lossless Markdown Serialization**: Frontmatter YAML metadata and markdown content are parsed and regenerated with absolute fidelity—never corrupting user files.
3. **Zero Cloud Requirement**: The entire core PKM operates standalone in the browser without requiring external servers or accounts. Cloud sync is strictly opt-in.
4. **Portal Popover Viewport Safety**: All floating toolbars and selectors render via `createPortal` to `document.body` with clamped viewport boundaries to eliminate overflow clipping.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">
Made with 🪁 for thinkers, writers, and hackers who value privacy and craftsmanship.
</div>
