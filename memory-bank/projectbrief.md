# Project Brief: Kite Workspace

## Overview
Kite is a high-performance, local-first knowledge management workspace modeled after Obsidian and Notion, powered by Tiptap as the rich-text editor engine.

## Core Goals
- **Dual Ingestion Architecture**: Support direct disk mounting via the Native File System Access API (`window.showDirectoryPicker()`) with in-place saving, alongside full recursive drag-and-drop / `webkitdirectory` folder uploads.
- **Tiptap Rich-Text Editor**: Markdown and YAML frontmatter lossless serialization, slash command popover menu (`/`), bidirectional WikiLinks (`[[`), draggable block handles, and inline media asset dropping.
- **Bidirectional Linking & Backlinks**: Fast indexing in IndexedDB (Dexie.js), showing linked references with context snippets and unlinked mentions.
- **Interactive Knowledge Graph**: D3-powered force-directed 2D canvas visualizing document nodes and WikiLink edges with tag filtering and orphan toggling.
- **Notion-Style Databases**: Inline and full view Table, Board (Kanban), and List views driven by frontmatter metadata with instant inline property edits.
- **Fuzzy Search**: Global `⌘K` modal searching notes by title, tags, and body content.
