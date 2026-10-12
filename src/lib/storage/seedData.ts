import { VaultFile } from './schema';

export const INITIAL_VAULT_NOTES: Array<Omit<VaultFile, 'id'> & { id?: string }> = [
  {
    path: 'Welcome to Caffeine.md',
    name: 'Welcome to Caffeine.md',
    title: 'Welcome to Caffeine',
    extension: 'md',
    content: `---
title: Welcome to Caffeine
tags: [getting-started, guide]
status: Doing
priority: High
eisenhower: urgent_not_immediate
author: Caffeine Team
---

# Welcome to Caffeine ☕

Caffeine is a high-performance, **local-first knowledge management workspace** modeled after **Obsidian** and **Notion**, powered by **Tiptap**, IndexedDB, and the File System Access API.

## Core Capabilities

- **Local Directory Binding**: Mount local disk folders directly via the native File System Access API or import entire directories via drag-and-drop.
- **Bidirectional Linking**: Type \`[[\` anywhere to link notes like [[Product Roadmap 2026]] or [[Architecture Decisions]].
- **Slash Commands**: Type \`/\` to quickly insert Headings, Callouts, Tasks, Code blocks, and Database views.
- **Knowledge Graph**: Visualize document connections and clusters in real-time in the interactive 2D graph view.
- **Notion-style Inline Databases**: Switch between **Table**, **Board (Kanban)**, and **List** views driven by frontmatter metadata.
- **Draggable Block Handles**: Reorder content blocks seamlessly.

### Quick Links & References

Check out our [[Architecture Decisions]] and see the current [[Product Roadmap 2026]].`,
    frontmatter: {
      title: 'Welcome to Caffeine',
      tags: ['getting-started', 'guide'],
      status: 'Doing',
      priority: 'High',
      eisenhower: 'urgent_not_immediate',
      author: 'Caffeine Team',
    },
    tags: ['getting-started', 'guide'],
    eisenhower: 'urgent_not_immediate',
    isBinary: false,
    size: 1024,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    vaultId: 'default-vault',
  },
  {
    path: 'Projects/Product Roadmap 2026.md',
    name: 'Product Roadmap 2026.md',
    title: 'Product Roadmap 2026',
    extension: 'md',
    content: `---
title: Product Roadmap 2026
tags: [project, roadmap, q1]
status: Someday / Maybe
priority: Critical
eisenhower: urgent_immediate
targetDate: 2026-11-15
assignee: Sarah Connor
---

# Product Roadmap 2026

Quarterly objectives and milestones for the Antigravity Knowledge Base runtime.

## Core Milestones
- [x] IndexedDB batch transaction engine
- [x] Drag & drop folder parsing with recursive webkitDirectory
- [ ] Real-time CRDT sync bridge
- [ ] Offline semantic search embedding cache

### Connected Notes
- See architectural foundations in [[Architecture Decisions]].
- Return to the main hub at [[Welcome to Caffeine]].`,
    frontmatter: {
      title: 'Product Roadmap 2026',
      tags: ['project', 'roadmap', 'q1'],
      status: 'Someday / Maybe',
      priority: 'Critical',
      eisenhower: 'urgent_immediate',
      targetDate: '2026-11-15',
      assignee: 'Sarah Connor',
    },
    tags: ['project', 'roadmap', 'q1'],
    eisenhower: 'urgent_immediate',
    isBinary: false,
    size: 890,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    vaultId: 'default-vault',
  },
  {
    path: 'Engineering/Architecture Decisions.md',
    name: 'Architecture Decisions.md',
    title: 'Architecture Decisions',
    extension: 'md',
    content: `---
title: Architecture Decisions
tags: [engineering, architecture]
status: Completed
priority: Medium
eisenhower: urgent_not_important
lead: Alex Vance
---

# Architecture Decisions

### ADR-01: Dual Ingestion Architecture
We support both native **File System Access API** (\`window.showDirectoryPicker\`) for disk binding and standard folder drops with \`webkitGetAsEntry()\` recursive tree reconstruction.

### ADR-02: Lossless Markdown & YAML Frontmatter
All note metadata is preserved via YAML frontmatter headers at the top of markdown documents, enabling zero lock-in interoperability with Obsidian, Logseq, and static site generators.

### ADR-03: Real-Time Backlink Indexing
When any note is modified or imported, outgoing \`[[WikiLinks]]\` are parsed and indexed in IndexedDB for instant sub-millisecond reverse lookups.

Referenced by [[Welcome to Caffeine]] and [[Product Roadmap 2026]].`,
    frontmatter: {
      title: 'Architecture Decisions',
      tags: ['engineering', 'architecture'],
      status: 'Completed',
      priority: 'Medium',
      eisenhower: 'urgent_not_important',
      lead: 'Alex Vance',
    },
    tags: ['engineering', 'architecture'],
    eisenhower: 'urgent_not_important',
    isBinary: false,
    size: 1100,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
    vaultId: 'default-vault',
  },
  {
    path: 'Research/Local-First Computing.md',
    name: 'Local-First Computing.md',
    title: 'Local-First Computing',
    extension: 'md',
    content: `---
title: Local-First Computing
tags: [research, architecture]
status: ToDO
priority: Medium
eisenhower: not_urgent_not_immediate
rating: 5
---

# Local-First Software Principles

Local-first software prioritizes user agency, zero network latency, and data ownership.

## Key Properties
1. No spinners for basic operations: read & write directly to local disk/IndexedDB.
2. User retains custody of raw text files.
3. Network is an optional sync channel, never a blocker.

Related work discussed in [[Architecture Decisions]].`,
    frontmatter: {
      title: 'Local-First Computing',
      tags: ['research', 'architecture'],
      status: 'ToDO',
      priority: 'Medium',
      eisenhower: 'not_urgent_not_immediate',
      rating: 5,
    },
    tags: ['research', 'architecture'],
    eisenhower: 'not_urgent_not_immediate',
    isBinary: false,
    size: 720,
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000,
    vaultId: 'default-vault',
  },
];
