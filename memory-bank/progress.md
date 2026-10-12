# Progress: Kite MD

## Milestone Status
- [x] **Core Storage & Ingestion**: Dexie schema, Native File System Access API mounting, recursive WebKit crawler, ephemeral trash can (`/src/lib/storage/`).
- [x] **Markdown & Serialization**: YAML frontmatter parsing, bi-directional WikiLinks, HTML-Markdown lossless serializer (`/src/lib/markdown/`).
- [x] **Rich-Text Editor**: Tiptap v2, StarterKit, highlight.js code blocks, task lists, tables, slash menu, floating wiki menu, block handles, universal emoji drawer (`Shift+Space`).
- [x] **Editor Toolbar & Metrics**: Decomposed bottom floating pill with Style, Heading, List, Media, and History popovers; real-time words/chars/tokens/emojis/links/KB metrics bar.
- [x] **Configurable Editor Toolbox Position**: Added 4-sided toolbox placement configuration (Left, Right, Bottom, Top) in `SettingsView.tsx` via `EditorSettingsSection.tsx` with live preview, `localStorage` persistence, directional popovers via `useToolbarPopover.ts`, and vertical/horizontal toolbar adaptability in `EditorBottomToolbar.tsx` and `TiptapEditor.tsx`.
- [x] **Databases & Views**: Frontmatter-driven Table view (column resizing, cell factory), Kanban Board (drag-and-drop status & Eisenhower grouping), List view, Tag Cloud.
- [x] **Knowledge Graph**: D3 force-directed physics simulation with decoupled edge/node renderers.
- [x] **Search & Navigation**: `⌘K` fuzzy search modal, hash routing permalinks (`/w/[id]#[view]`), memoized file tree with ellipsis actions.
- [x] **Cloud Sync & Themes**: Google Drive 5MB resumable chunk sync; 14 CSS variable themes with AI Theme Studio; universal `Noto Color Emoji` web font embedding; updated brand logo to Kite emoji `🪁`.
- [x] **7-Stage Architectural Refactoring**: Decomposed all large legacy god modules into modular 100–250 LOC components.
- [x] **Brand Refresh**: Rebranded all user-facing product references and metadata from "Kite Workspace"/"Kite" to "Kite MD".
- [x] **File Explorer Resizing**: Draggable right border on sidebar with persistent custom width (180px–720px), double-click reset, and keyboard accessibility.
- [x] **Editor Properties Layout**: Rearranged properties bar into 3 structured rows (Title & Author; Status & Priority; Tags) and collapsed by default.
- [x] **Mobile Editor Whitespace Optimization**: Responsive editor wrapper padding (`px-4 pt-2 sm:pt-4 md:pt-6 pb-8`), reduced title bottom margin on mobile (`mb-2 sm:mb-4 md:mb-6`), zero-overhead collapsible note properties (`NotePropertiesCard.tsx`), and ProseMirror/Tiptap first-child margin collapse (`[&>*:first-child]:mt-0`).
- [x] **Plaintext Editor Gutter Scroll Sync with Dynamic Line Wrapping**: Synchronized textarea and line number gutter vertical scroll offsets (`scrollTop`) via React `useRef`, `onScroll`, and `onWheel` handlers in `PlaintextMarkdownEditor.tsx`, with bounded container heights (`h-[550px] sm:h-[680px] max-h-[calc(100vh-220px)] min-h-[350px] sm:min-h-[480px]`), `h-full` gutter clipping, unified typography/padding, and off-screen DOM mirror with `ResizeObserver` measuring dynamic wrapped line heights to maintain 1:1 pixel alignment across soft wrapping with toolbar toggle.
- [x] **Diff Viewer (Unsaved vs Saved)**: Added third editor mode with toggle in `EditorHeader.tsx`, side-by-side split & unified line diffing via `diff` in `diffUtils.ts` (110 LOC) and `DiffViewer.tsx` (228 LOC), colored additions/deletions, stat badges, and immediate Save / Discard actions retaining in-memory working copy without premature persistence.
- [x] **Project Documentation**: Created comprehensive, badass `README.md` with ASCII art header, product manifesto, feature matrix, architecture flow, keyboard shortcuts, quickstart, and engineering principles.
- [x] **Settings Shortcuts & Controls Synchronization**: Updated the "Shortcuts & Controls" section in `StorageSettingsSection.tsx` with all 8 keyboard shortcuts and scope tags documented in `README.md`, adhering to the strict 100–250 LOC boundary (232 LOC).

## Verification
- Linting (`pnpm lint`): 0 errors, 0 warnings.
- Type checking (`pnpm tsc --noEmit`): 0 errors.
- LOC Boundaries: 100% compliant (100–250 LOC).
