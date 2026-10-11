# Progress: Kite MD

## Milestone Status
- [x] **Core Storage & Ingestion**: Dexie schema, Native File System Access API mounting, recursive WebKit crawler, ephemeral trash can (`/src/lib/storage/`).
- [x] **Markdown & Serialization**: YAML frontmatter parsing, bi-directional WikiLinks, HTML-Markdown lossless serializer (`/src/lib/markdown/`).
- [x] **Rich-Text Editor**: Tiptap v2, StarterKit, highlight.js code blocks, task lists, tables, slash menu, floating wiki menu, block handles, universal emoji drawer (`Shift+Space`).
- [x] **Editor Toolbar & Metrics**: Decomposed bottom floating pill with Style, Heading, List, Media, and History popovers; real-time words/chars/tokens/emojis/links/KB metrics bar.
- [x] **Databases & Views**: Frontmatter-driven Table view (column resizing, cell factory), Kanban Board (drag-and-drop status & Eisenhower grouping), List view, Tag Cloud.
- [x] **Knowledge Graph**: D3 force-directed physics simulation with decoupled edge/node renderers.
- [x] **Search & Navigation**: `⌘K` fuzzy search modal, hash routing permalinks (`/w/[id]#[view]`), memoized file tree with ellipsis actions.
- [x] **Cloud Sync & Themes**: Google Drive 5MB resumable chunk sync; 14 CSS variable themes with AI Theme Studio; universal `Noto Color Emoji` web font embedding; updated brand logo to Kite emoji `🪁`.
- [x] **7-Stage Architectural Refactoring**: Decomposed all large legacy god modules into modular 100–250 LOC components.
- [x] **Brand Refresh**: Rebranded all user-facing product references and metadata from "Kite Workspace"/"Kite" to "Kite MD".
- [x] **File Explorer Resizing**: Draggable right border on sidebar with persistent custom width (180px–720px), double-click reset, and keyboard accessibility.
- [x] **Editor Properties Layout**: Rearranged properties bar into 3 structured rows (Title & Author; Status & Priority; Tags) and collapsed by default.

## Verification
- Linting (`pnpm lint`): 0 errors, 0 warnings.
- Type checking (`pnpm tsc --noEmit`): 0 errors.
- LOC Boundaries: 100% compliant (100–250 LOC).
