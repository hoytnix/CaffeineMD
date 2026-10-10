# Product Context: Kite Workspace

## Problem Domain
Knowledge workers, researchers, and engineers often want the flexible Markdown file storage and bidirectional graph capabilities of Obsidian combined with the structured database properties and fluid block editing of Notion, without cloud lock-in or latency.

## User Experience Flows
1. **Mounting or Importing Vaults**:
   - User clicks "Import Vault" or drops a folder hierarchy into the sidebar.
   - User can choose "Live Disk Folder" via File System Access API for zero-copy in-place edits on their filesystem, or upload via `webkitdirectory`.
2. **Note Creation & Editing**:
   - Notes are authored with rich text formatting, slash commands (`/`), task lists, tables, callouts, and code blocks.
   - Typing `[[` activates autocomplete for other vault documents.
3. **Properties & Backlink Inspection**:
   - YAML frontmatter properties (`tags`, `status`, `priority`, etc.) are displayed and editable at the base of every note.
   - Linked references display which documents cite the current note with contextual text snippets.
4. **Structured Databases & Knowledge Graph**:
   - Databases parse frontmatter properties across notes to render interactive Tables and Kanban boards.
   - The knowledge graph provides 2D force simulation with physics, scaling nodes based on connections.
