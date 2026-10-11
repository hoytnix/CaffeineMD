# Project Brief: Kite

Local-first, high-performance personal knowledge management system modeled after Obsidian and Notion, powered by Tiptap v2.

## Core Pillars
- **Dual Ingestion**: Live disk folder mounting (`showDirectoryPicker`) + recursive folder drop (`webkitdirectory`).
- **Rich Editor**: Tiptap v2 Markdown + YAML frontmatter serialization, slash commands (`/`), WikiLinks (`[[`), drag handles, tables, task lists.
- **Bi-directional Knowledge Graph**: D3 force-directed physics graph, WikiLink indexing, backlinks & unlinked mentions.
- **Frontmatter Databases**: Notion-style Table, Kanban Board, and List views powered by note frontmatter metadata.
- **Search & Sync**: Global `⌘K` fuzzy search, Google Drive cloud sync with delta reconciliation.
