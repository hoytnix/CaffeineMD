# Tiptap Editor, Modes & Markdown Pipeline

This document details CaffeineMD's editing engine, multi-mode architecture, custom ProseMirror extensions, event interception mechanisms, and lossless Markdown serialization pipeline.

---

## 1. Tri-Mode Editor Architecture

CaffeineMD provides three specialized viewing and editing modes for every document, coordinated via `workspaceStore.editorMode`:

```
                                 ┌────────────────────────────┐
                                 │   SplitPaneContainer.tsx   │
                                 └─────────────┬──────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│     WYSIWYG Editor      │       │    Plaintext Editor     │       │       Diff Viewer       │
│    TiptapEditor.tsx     │       │ PlaintextMarkdownEditor │       │     DiffViewer.tsx      │
│  • Headless Tiptap v2   │       │  • Soft-wrapped gutter  │       │  • Split & unified diff │
│  • ProseMirror schemas  │       │  • Synchronized scroll  │       │  • Revert / commit safe │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### 1.1 Rich WYSIWYG Mode (`TiptapEditor.tsx` & `useTiptapInit.ts`)
- Built on **Tiptap v2** and ProseMirror.
- Employs headless DOM rendering with custom schema marks for bold, italics, underline, code, and links.
- Supports interactive node views for tables (`@tiptap/extension-table`), task items, code block runners, images, and embedded callouts.
- Initializes cleanly without client/server layout thrashing via `useTiptapInit.ts`.

### 1.2 Plaintext Editor (`PlaintextMarkdownEditor.tsx`)
- Raw text mode displaying the exact Markdown source code with frontmatter header.
- **Dynamic Soft-Wrap Gutter Measurement**:
  - Raw code editors usually misalign line numbers when long sentences wrap onto multiple display lines.
  - CaffeineMD solves this using an off-screen DOM mirror with `ResizeObserver`:
  - Measures the rendered height of each line div and computes matching heights for gutter line counters, ensuring pixel-perfect 1:1 vertical alignment regardless of font scaling or viewport width.
  - Features synchronized scrolling between the line gutter and text editor canvas.

### 1.3 Split & Unified Diff Viewer (`DiffViewer.tsx` & `diffUtils.ts`)
- Inspects unsaved buffer modifications against the persistent IndexedDB disk copy before saving or committing.
- Powered by `diff` (jsdiff) line comparison algorithms.
- **Display Modes**:
  - **Split View**: Side-by-side comparison with green additions and red deletions aligned.
  - **Unified View**: Inline chronological patch view.
- Provides 1-click **Revert** (discards buffer changes) or **Commit** (writes buffer to IndexedDB).

### 1.4 Dual-Pane Split Editor (`SplitPaneContainer.tsx`)
- Triggered via `⌘\` or the split view button.
- Renders two independent editor instances side-by-side on desktop, or stacked vertically on smaller screens.
- Supports independent document paths (`activeFilePath` in Primary Pane, `splitNoteId` in Secondary Pane), enabling seamless cross-note referencing and note-to-note copying.

---

## 2. Custom Tiptap Extensions & Interactions

CaffeineMD extends Tiptap with specialized block and inline extensions located in [`src/components/editor/extensions/`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/):

### 2.1 WikiLinks (`[[Note Title]]`)
- **Node & Extension**: [`WikiLink.ts`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/WikiLink.ts).
- **Suggestion Menu**: [`FloatingWikiLinkMenu.tsx`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/menus/FloatingWikiLinkMenu.tsx).
- **Isolation Rule**: Uses a dedicated `PluginKey('wikilink-suggestion')` to prevent ProseMirror `RangeError` clashes with slash commands.
- Typing `[[` activates the floating autocomplete menu, filtering existing vault note titles and allowing 1-click creation of missing notes.

### 2.2 Slash Commands (`/`)
- **Extension**: [`SlashCommand.ts`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/SlashCommand.ts).
- **Menu Portal**: [`FloatingSlashMenu.tsx`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/menus/FloatingSlashMenu.tsx).
- Renders clamped to viewport coordinates. Inserts callouts, tables, code blocks, task lists, and headings.

### 2.3 External Link Preview & Navigation Interception
Located across [`IosLinkPreviewCard.tsx`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/IosLinkPreviewCard.tsx), [`ExternalCardContent.tsx`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/ExternalCardContent.tsx), and [`editorDomHandlers.ts`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/config/editorDomHandlers.ts):

#### The iOS Safari WebKit Problem:
Inside `contenteditable="true"` surfaces (like `.ProseMirror`), tapping an `<a href="https://...">` tag with `target="_blank"` triggers iOS Safari's native link navigation before or alongside bubbling JavaScript `click` listeners. This forces a new browser tab to open, bypassing rich preview cards.

#### The Solution Architecture:
1. **Remove `target="_blank"` from Editor Marks (`editorExtensions.ts`)**:
   ```ts
   Link.configure({
     openOnClick: false,
     autolink: true,
     HTMLAttributes: {
       rel: 'noopener noreferrer',
       target: null, // Crucial: Suppresses native iOS WebKit link launch
     },
   })
   ```
2. **Capture-Phase Interception (`IosLinkPreviewCard.tsx`)**:
   - Event listeners are attached with `{ capture: true }` directly on `editor.view.dom`:
   - Runs in the capture phase before ProseMirror or native browser navigation handlers.
   - When tapping or clicking an external link (`a[href]:not([data-wikilink])`):
     - Calls `e.preventDefault()`, `e.stopPropagation()`, and `e.stopImmediatePropagation()`.
     - Opens `IosLinkPreviewCard` anchored to that link's DOM bounding rect.
3. **Touch vs. Scroll Discrimination**:
   - `handleTouchStart` records touch coordinates.
   - `handleTouchEnd` checks displacement (`dx <= 10 && dy <= 10 && dt <= 800`). If the user was scrolling or dragging, the link tap is ignored and the scroll continues naturally.
4. **Click Pinning Against Mouseout**:
   - Hovering over a link on desktop opens the preview after a 280ms delay.
   - If a link was explicitly **clicked or tapped**, `isClickedRef.current = true`. A subsequent `mouseout` event will **not** close the preview card until the user clicks outside, hits `Escape`, or hovers in and out of the card.
5. **The "Open" Button in Link Preview**:
   - Inside `ExternalCardContent.tsx` (rendered outside ProseMirror via `createPortal` to `document.body`), the "Open" button renders a native `<a href={url} target="_blank">`, allowing users to open the URL in a new tab on demand.

### 2.4 Editor HUD & Productivity Overlays
- **Block Drag Handles (`BlockHandle.tsx`)**: Floating grab handle rendering in the left gutter, allowing 1-click block dragging, reordering, and context actions.
- **Minimap (`EditorMinimap.tsx`)**: Right-hand micro-canvas rendering an interactive document thumbnail for rapid spatial jumping across long notes.
- **Document Outline HUD (`DocumentOutlineHud.tsx`)**: Floating table of contents parsing H1–H6 heading hierarchies with active section highlighting.

---

## 3. Bidirectional Markdown Serialization & Frontmatter

CaffeineMD ensures 100% data sovereignty by keeping all files stored as standard, lossless Markdown text.

```
       Disk / IndexedDB (Markdown with YAML Frontmatter)
                             │
                             ▼
     parseFrontmatter() (Extracts metadata & clean body)
                             │
                             ▼
     markdownToEditorHtml() (Converts Markdown AST to HTML)
                             │
                             ▼
                   Tiptap ProseMirror DOM
                             │
                         (Edits)
                             │
                             ▼
     editorHtmlToMarkdown() (Converts HTML AST to Markdown)
                             │
                             ▼
   serializeFrontmatter() (Re-attaches YAML header losslessly)
                             │
                             ▼
                 Persist to IndexedDB / Disk
```

### 3.1 YAML Frontmatter Parsing & Serialization
Implemented in [`src/lib/markdown/frontmatter.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/markdown/frontmatter.ts):
- Uses `js-yaml` to parse and dump YAML headers delimited by `---`.
- **`parseFrontmatter(rawContent)`**: Returns `{ frontmatter, content: cleanBody }`.
- **`serializeFrontmatter(cleanMarkdown, frontmatter)`**: Merges updated properties back into the Markdown header while preserving property ordering, formatting, and custom fields.
- **`NotePropertiesCard.tsx`**: Renders an interactive Notion-like properties widget at the top of notes, exposing Title, Tags, Eisenhower quadrant, Status, Author, and custom attributes.

### 3.2 HTML and Markdown AST Pipelines
- **`markdownToHtml.ts`**: Converts raw Markdown into sanitized HTML fragments consumable by Tiptap's schema, including task lists (`- [x]`), callouts (`> [!NOTE]`), and code blocks with syntax highlighting.
- **`htmlToMarkdown.ts`**: Traverses ProseMirror's DOM output, generating clean GitHub-Flavored Markdown.
- **`smartPaste.ts`**: Intercepts clipboard paste events. Detects whether incoming data is raw HTML, Markdown, URLs, or image blobs, converting them cleanly into the corresponding Tiptap nodes without escaping artifacts.

### 3.3 Debounced Autosave & Baseline Tracking
Implemented in [`src/components/editor/hooks/useEditorAutosave.ts`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/hooks/useEditorAutosave.ts):
- Compares active editor content against a cached `baselineContent` loaded from storage.
- Automatically debounces saves by 250ms during active typing.
- Only marks documents as dirty and dispatches storage writes when actual substantive text or frontmatter changes have occurred, preventing redundant sync cycles.
