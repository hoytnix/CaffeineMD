# Database Views, Force Graph & PWA/HTML Exporter

This document details CaffeineMD's frontmatter relational database engine, 2D force-directed knowledge graph simulation, and static PWA / monolithic HTML export pipeline.

---

## 1. Frontmatter Database Engine

CaffeineMD transforms standard Markdown notes into relational database records without requiring external database servers or cloud silos.

```
          Folder Markdown Notes (with YAML Frontmatter Headers)
                                    │
                                    ▼
       useDatabaseSchema.ts (Extracts dynamic properties & types)
                                    │
      ┌─────────────────────────────┼─────────────────────────────┐
      ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Table View   │           │  Kanban View  │           │   List View   │
│ TableView.tsx │           │ KanbanView.tsx│           │  ListView.tsx │
│ • Columns     │           │ • Lanes       │           │ • Compact     │
│ • Resizing    │           │ • Eisenhower  │           │ • Fast filter │
│ • Multi-sort  │           │ • Drag & Drop │           │ • Property tag│
└───────────────┘           └───────────────┘           └───────────────┘
```

### 1.1 Dynamic Schema Extraction (`useDatabaseSchema.ts`)
- Inspects all notes within the selected folder (e.g., `/Projects` or vault root).
- Parses each note's `frontmatter` dictionary to synthesize column definitions:
  - **Property Types**: Text, Number, Select/Tag, Multi-Select, Checkbox, Date, URL, and Eisenhower Quadrant.
- Dynamically assigns column renderers and editor popovers without requiring fixed database schemas.

### 1.2 Table View (`TableView.tsx`)
- High-density spreadsheet interface modeled after Notion.
- **Interactive Capabilities**:
  - Resizable column widths via `useColumnResize.ts` with stored pixel widths.
  - Multi-property sorting (ascending/descending) and text/tag filters.
  - Inline property edits directly modifying the note's frontmatter in IndexedDB and triggering debounced sync.
  - Quick-add row button creating a new note with pre-populated frontmatter properties.

### 1.3 Kanban Board CRUD, Custom Lanes & Eisenhower Matrix (`KanbanView.tsx`, `kanbanSlice.ts`)
- **Board-Level CRUD & Reordering (`KanbanBoardSelector.tsx`, `KanbanBoardModals.tsx`)**:
  - Users can create multiple named Kanban boards (e.g., `Task Status`, `Eisenhower Matrix`, `Not ToDO`, `Sprint Backlog`), switch between active boards, reorder boards via HTML5 drag-and-drop pill tabs, rename boards, and delete boards (automatically falling back to the default board).
  - Board configurations, order, and active board state are managed in `kanbanSlice.ts` (`reorderKanbanBoards`) and persisted via `storageRegistry` (`caffeinemd-kanban-boards` and `caffeinemd-active-kanban-board`).
- **Column/Lane-Level CRUD & Reordering (`KanbanColumnMenu.tsx`, `KanbanAddColumnCard.tsx`, `KanbanColumn.tsx`)**:
  - **Add Column**: Inline `+ Add Column` card at the end of the board viewport appends custom lanes (e.g., `Not ToDO`) to the active board.
  - **Reorder Columns**: Dragging a column by its header grip handle allows rearranging column orders with visual drop targets and persistent storage via `reorderColumnsInBoard`.
  - **Rename Column & Batch Migration**: Renaming a column updates the board schema and executes an atomic batch frontmatter migration across all matching notes in IndexedDB via `executeVaultMutation` and `serializeFrontmatter`.
  - **Delete Column**: Removing a column reassigns any orphaned cards in that lane to the board's primary fallback column via `executeVaultMutation`.
- **Card Drag-and-Drop (`useKanbanDragAndDrop.ts`)**:
  - Dragging a card between columns updates the note's frontmatter `status`, `eisenhower`, or custom grouping attribute instantly with optimistic UI feedback without conflicting with column drag mechanics.

### 1.4 List View & Responsive Card Grid (`ListView.tsx`, `ListCardItem.tsx`)
- Dual-mode document layout engine allowing seamless toggling between:
  - **Compact List Mode**: Distraction-free, dense vertical feed displaying document titles, status pills, Eisenhower priority indicators, author badges, tags, and modification dates.
  - **Card Grid Mode (`ListCardItem.tsx`)**: Responsive multi-column visual gallery (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`) featuring:
    - Note icon/emoji and title with hover accent highlights.
    - Frontmatter status badge (e.g. `todo`, `in-progress`, `done`) and Eisenhower priority quadrant pill.
    - Plaintext body excerpt preview truncated to 3 lines (`line-clamp-3`).
    - Tag badge pills with truncated overflow indicators.
    - Relative timestamps (`Just now`, `5m ago`, `2h ago`, `3d ago`) with full localized date tooltips.
    - Solid theme token background (`var(--card)`) preserving opacity against custom wallpaper backgrounds.
    - Full keyboard accessibility (`Enter`/`Space` activation).
- **Layout Switcher & Persistence**:
  - Embedded quick switcher and toolbar toggle in `ViewSwitcher.tsx` enabling instant layout switching.
  - Preference state stored in `useWorkspaceStore` (`listViewLayout: 'list' | 'grid'`) and persisted across reloads in `localStorage` (`caffeinemd-list-layout`).

---

## 2. 2D Force-Directed Knowledge Graph

Located in [`src/components/graph/`](file:///home/oloty/Dev/CaffeineMD/src/components/graph/) and [`src/lib/graph/`](file:///home/oloty/Dev/CaffeineMD/src/lib/graph/):

```
       IndexedDB (files & backlinks) ──► useGraphData.ts
                                              │ (Nodes & Links)
                                              ▼
                                 physicsSimulation.ts (d3-force)
                                              │ (Velocity-Verlet)
                                              ▼
                             graphCanvasRenderer.ts (HTML5 Canvas)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
            Node Shaders & Halos                            Interactive Pan / Zoom
            (Theme Palette Aware)                           (Wheel & Drag Gestures)
```

### 2.1 Physics Simulation Engine (`physicsSimulation.ts`)
- Powered by `d3-force` running velocity-Verlet numerical integration:
  - **Link Force (`forceLink`)**: Keeps connected WikiLink nodes at target spring lengths.
  - **Many-Body Repulsion (`forceManyBody`)**: Prevents node overlap with customizable charge strength.
  - **Centering Force (`forceCenter`)**: Keeps the topology balanced around canvas center.
  - **Collision Force (`forceCollide`)**: Ensures nodes have radial boundaries preventing text label collisions.

### 2.2 High-Performance Canvas Renderer (`graphCanvasRenderer.ts`)
- Renders directly to HTML5 Canvas rather than SVG to sustain 60 FPS performance on vaults with 1,000+ nodes.
- **Node & Edge Styling**:
  - Automatically pulls `--theme-accent`, `--theme-text-primary`, and `--theme-border` tokens to match the active theme.
  - Connected nodes glow with soft radial halos.
  - Active hovered nodes highlight connected incoming and outgoing link edges while dimming unrelated nodes.

### 2.3 Graph HUD Controls
- Floating viewport HUD allowing users to:
  - Adjust repulsion charge and link distance dynamically.
  - Toggle orphan nodes (nodes with 0 connections).
  - Search and spotlight specific nodes with automatic camera zoom.

---

## 3. Production PWA & Standalone HTML Exporter

CaffeineMD features a static publishing pipeline in [`src/lib/export/`](file:///home/oloty/Dev/CaffeineMD/src/lib/export/) and [`src/components/export/`](file:///home/oloty/Dev/CaffeineMD/src/components/export/):

```
       Markdown Vault Notes ──► Standalone HTML Builder (Direct Monolithic HTML)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          Standalone Single/Folder HTML                  Production PWA Bundle (ZIP)
          • Inlined Base64 Assets                        • Service Worker (sw.js)
          • Client-Side Jinja2 Compiler                  • PWA Manifest (manifest.webmanifest)
          • Embedded 2D Canvas Graph                     • Inverted Spotlight Search Index
          • Embedded Spotlight Search                    • Offline Cache Precaching
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                             1-Click Edge Deployment Modules
                             • Netlify Edge (netlifyDeployer.ts)
                             • GitHub Pages (githubDeployer.ts)
```

### 3.1 One-Shot Monolithic HTML App Synthesis (Static DOM-First)
- **Direct Monolithic HTML Generation**:
  - Turns markdown notes or entire folders into production-grade HTML applications in one shot with zero external build tools.
  - **Static DOM-First Architecture**: Note bodies are pre-compiled into clean HTML fragments with frontmatter stripped and embedded directly into `<div class="documents-container">`, rather than serializing them into fragile JavaScript string arrays (`const docs = [...]`). This completely eliminates template string parsing errors and runtime JS syntax crashes.

### 3.2 Client-Side Jinja2 Template Compiler (`jinjaCompiler.ts`)
- High-performance browser-native template engine.
- Supports variables (`{{ title }}`, `{{ content }}`), built-in filters (`escape`, `lower`, `upper`, `trim`), booleans and equality conditionals (`{% if is_pwa %}`), and collection loops (`{% for page in pages %}`) for offline navigation drawers.
- Uses editable vault `_template.html` files stored directly in IndexedDB, allowing users to tweak CSS and layouts directly in CaffeineMD.

### 3.3 Asset Inlining & Bundling (`assetBundler.ts`)
- **Standalone HTML Exports**: Inlines local images, fonts, and media attachments as Base64 data URIs for 100% offline self-contained files.
- **Production PWA ZIPs**: Extracts assets into an `/assets/` directory with explicit Cache-First Service Worker precaching (`sw.js`).

### 3.4 Standalone Canvas Graph & Inverted Search
- **Canvas Graph HUD (`canvasGraphHud.ts`)**: Exports bundle a self-contained 2D HTML5 canvas knowledge graph with interactive pan, zoom, and spring physics.
- **Vault Search Index (`vaultSearchIndex.ts`)**: Generates an inverted token index with a built-in `⌘K` spotlight modal in every standalone export.

### 3.5 1-Click Edge Distribution
- **Netlify Edge Deployer ([`netlifyDeployer.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/export/deployers/netlifyDeployer.ts))**: Deploys exported static sites or PWA ZIP bundles directly to Netlify edge using personal access tokens.
- **GitHub Pages Deployer ([`githubDeployer.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/export/deployers/githubDeployer.ts))**: Pushes static site bundles directly to a user's `gh-pages` repository branch via GitHub REST API with zero CI/CD build servers required.
