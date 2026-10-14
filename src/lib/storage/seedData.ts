import { VaultFile } from './schema';
import { WELCOME_NOTE_CONTENT } from './welcomeNoteContent';

export const INITIAL_VAULT_NOTES: Array<Omit<VaultFile, 'id'> & { id?: string }> = [
  {
    path: '/Welcome to CaffeineMD ☕.md',
    name: 'Welcome to CaffeineMD ☕.md',
    title: 'Welcome to CaffeineMD ☕',
    extension: 'md',
    content: WELCOME_NOTE_CONTENT,
    frontmatter: {
      title: 'Welcome to CaffeineMD ☕',
      status: 'Active',
      category: 'Documentation',
      priority: 'High',
      tags: ['welcome', 'showcase', 'pwa', 'wasm', 'markdown'],
    },
    tags: ['welcome', 'showcase', 'pwa', 'wasm', 'markdown'],
    isBinary: false,
    size: WELCOME_NOTE_CONTENT.length,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    vaultId: 'default-vault',
  },
  {
    path: 'Project Alpha.md',
    name: 'Project Alpha.md',
    title: 'Project Alpha',
    extension: 'md',
    content: `---
title: Project Alpha
tags: [project, alpha, roadmap]
status: Doing
priority: High
eisenhower: urgent_immediate
---

# Project Alpha

Core development tracker and architecture milestone roadmap for Project Alpha.

## Core Milestones
- [x] IndexedDB batch transaction engine & folder mounting
- [x] Sandboxed polyglot WASM execution environment
- [ ] Real-time local-first sync bridge
- [ ] Offline semantic search embedding cache

### Connected Hubs
- Return to the main hub at [[Welcome to CaffeineMD ☕]].
- Explore related brainstorming in [[Ideas]].`,
    frontmatter: {
      title: 'Project Alpha',
      tags: ['project', 'alpha', 'roadmap'],
      status: 'Doing',
      priority: 'High',
      eisenhower: 'urgent_immediate',
    },
    tags: ['project', 'alpha', 'roadmap'],
    eisenhower: 'urgent_immediate',
    isBinary: false,
    size: 780,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    vaultId: 'default-vault',
  },
  {
    path: 'Ideas.md',
    name: 'Ideas.md',
    title: 'Ideas',
    extension: 'md',
    content: `---
title: Ideas
tags: [ideas, brainstorm]
status: Someday / Maybe
priority: Medium
eisenhower: not_urgent_not_immediate
---

# Ideas & Brainstorming

Explorations and emergent concepts for upcoming iterations of CaffeineMD.

## Concepts Under Evaluation
- Edge-rendered static site publishing with Jinja templates
- In-browser SQLite query workbench with interactive chart visualizers
- Deep-linking backlinks connecting [[Project Alpha]] and [[Welcome to CaffeineMD ☕]]`,
    frontmatter: {
      title: 'Ideas',
      tags: ['ideas', 'brainstorm'],
      status: 'Someday / Maybe',
      priority: 'Medium',
      eisenhower: 'not_urgent_not_immediate',
    },
    tags: ['ideas', 'brainstorm'],
    eisenhower: 'not_urgent_not_immediate',
    isBinary: false,
    size: 620,
    createdAt: Date.now() - 64800000,
    updatedAt: Date.now() - 64800000,
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

Referenced by [[Welcome to CaffeineMD ☕]] and [[Project Alpha]].`,
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

Related work discussed in [[Architecture Decisions]] and [[Welcome to CaffeineMD ☕]].`,
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
