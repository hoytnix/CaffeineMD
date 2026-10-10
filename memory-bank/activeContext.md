# Active Context: Kite Workspace

## Current Focus
Implemented Code Block Syntax Highlighting with Automatic Language Detection via lowlight and highlight.js, fixed Note Deletion across IndexedDB and live disk handles with affirmative toast confirmations, corrected Task/Checkbox vertical alignment, built the dedicated Tag Cloud View with 400-character clean plaintext excerpts and interactive hashtag links, and added the Eisenhower Matrix priority system across Note Properties, Table, Kanban, List, File Tree, and Graph views.

## Key Changes
1. **Code Block Syntax Highlighting & Auto Language Detection**:
   - Installed `@tiptap/extension-code-block-lowlight`, `lowlight`, and `highlight.js`.
   - Configured `CodeBlockLowlight` in `TiptapEditor.tsx` with common programming languages (TypeScript, JavaScript, Python, Rust, Go, Bash, JSON, YAML, HTML, CSS, SQL, Markdown).
   - Smart language detection in `markdownToHtml.ts` and `TiptapEditor.tsx` via `lowlight.highlightAuto()` on mount/changes when code blocks lack explicit language attributes.
   - Theme-aware syntax CSS variables (`--syntax-keyword`, `--syntax-string`, `--syntax-function`, `--syntax-comment`, `--syntax-variable`, `--syntax-number`, `--syntax-operator`, `--syntax-bg`) mapped to hljs classes in `app/globals.css`.
   - Updated all 14 theme definitions + Custom in `src/lib/themes/themeDefinitions.ts` with tailored palette syntax colors.
2. **Note Deletion & Trash Can Fix**:
   - Implemented `deleteNote(path)` in `src/stores/workspaceStore.ts` and `deleteVaultFile(path)` in `src/lib/storage/db.ts`.
   - Prunes backlinks, removes entries from IndexedDB, and deletes physical files from mounted disk directories via `NativeFileSystemAdapter.removeFileFromDisk(path)`.
   - Safely closes active tabs, switches editor focus to the next open tab (or empty state), and presents an affirmative toast notification (`"Note deleted"`).
   - Added trash can delete buttons to `EditorHeader.tsx` and hover actions in `FileTreeItem.tsx`.
3. **Task / Checkbox Vertical Alignment**:
   - Corrected task list item styling in `app/globals.css` with `align-items: flex-start`, flex gap `0.625rem`, label `padding-top: 0.18rem`, and `accent-color: var(--accent)` for perfect vertical alignment with line-height cap-height of body text.
4. **Tag Cloud View & Interactive Tag Linking**:
   - Built `src/components/tags/TagCloudView.tsx` with top tag navigation pill cloud showing count badges (e.g. `#project (8)`).
   - Searchable and filterable grid of note cards displaying title, path, date, Eisenhower urgency dot/indicator, full list of secondary tags, and first 400 characters of clean plaintext body preview (stripping YAML, markdown headers, links, and formatting).
   - Interactive tag badges in `EditorHeader.tsx` and Note Properties drawer that immediately switch views to the Tag Cloud view with that tag filtered.
5. **Eisenhower Matrix Priority & Cross-View Indicators**:
   - Added `EisenhowerQuadrant` type and configuration (`EISENHOWER_CONFIG`) in `src/lib/storage/db.ts`, `src/lib/markdown/frontmatter.ts`, and `src/hooks/useDatabaseSchema.ts`.
   - Dedicated dropdown selector in Note Properties drawer (`BacklinksPanel.tsx`):
     - 🔴 Urgent & Immediate (Do First)
     - 🟡 Urgent & Not Immediate (Schedule)
     - 🔵 Not Urgent & Immediate (Delegate / Quick)
     - ⚪ Not Urgent & Not Immediate (Don't / Backlog)
   - Visual indicators across all views:
     - Table View: Eisenhower column with colored pill dots and quick selector.
     - Kanban View: Quadrant color badge on card headers.
     - List View: Prefix colored quadrant dot on each row.
     - Sidebar File Tree: Subtle quadrant dot next to note icons.
     - Graph View: Colored note rings/halos with toggle in Graph Controls.
