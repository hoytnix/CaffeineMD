import Dexie, { Table } from 'dexie';

export type EisenhowerQuadrant =
  | 'urgent_immediate' // Urgent & Immediate (Do First)
  | 'urgent_not_immediate' // Urgent & Not Immediate (Schedule)
  | 'not_urgent_immediate' // Not Urgent & Immediate (Delegate / Quick)
  | 'not_urgent_not_immediate' // Not Urgent & Not Immediate (Don't / Backlog)
  | 'urgent_important' // Backwards compatibility alias
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'Urgent & Immediate'
  | 'Urgent & Not Immediate'
  | 'Not Urgent & Immediate'
  | 'Not Urgent & Not Immediate';

export interface EisenhowerOption {
  key: EisenhowerQuadrant;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string; // hex
  dotBg: string; // tailwind class
  badgeClass: string;
  textColor: string;
}

export const EISENHOWER_CONFIG: Record<string, EisenhowerOption> = {
  urgent_immediate: {
    key: 'urgent_immediate',
    label: 'Urgent & Immediate',
    shortLabel: 'Do First',
    emoji: '🔴',
    color: '#ef4444',
    dotBg: 'bg-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    textColor: 'text-red-500',
  },
  urgent_not_immediate: {
    key: 'urgent_not_immediate',
    label: 'Urgent & Not Immediate',
    shortLabel: 'Schedule',
    emoji: '🟡',
    color: '#eab308',
    dotBg: 'bg-yellow-500',
    badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    textColor: 'text-yellow-500',
  },
  not_urgent_immediate: {
    key: 'not_urgent_immediate',
    label: 'Not Urgent & Immediate',
    shortLabel: 'Delegate',
    emoji: '🔵',
    color: '#3b82f6',
    dotBg: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    textColor: 'text-blue-500',
  },
  not_urgent_not_immediate: {
    key: 'not_urgent_not_immediate',
    label: 'Not Urgent & Not Immediate',
    shortLabel: 'Backlog',
    emoji: '⚪',
    color: '#9ca3af',
    dotBg: 'bg-neutral-400',
    badgeClass: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    textColor: 'text-neutral-400',
  },
  // Backwards compatibility aliases
  urgent_important: {
    key: 'urgent_immediate',
    label: 'Urgent & Immediate',
    shortLabel: 'Do First',
    emoji: '🔴',
    color: '#ef4444',
    dotBg: 'bg-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    textColor: 'text-red-500',
  },
  not_urgent_important: {
    key: 'urgent_not_immediate',
    label: 'Urgent & Not Immediate',
    shortLabel: 'Schedule',
    emoji: '🟡',
    color: '#eab308',
    dotBg: 'bg-yellow-500',
    badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    textColor: 'text-yellow-500',
  },
  urgent_not_important: {
    key: 'not_urgent_immediate',
    label: 'Not Urgent & Immediate',
    shortLabel: 'Delegate',
    emoji: '🔵',
    color: '#3b82f6',
    dotBg: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    textColor: 'text-blue-500',
  },
  'Urgent & Immediate': {
    key: 'Urgent & Immediate',
    label: 'Urgent & Immediate',
    shortLabel: 'Do First',
    emoji: '🔴',
    color: '#ef4444',
    dotBg: 'bg-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    textColor: 'text-red-500',
  },
  'Urgent & Not Immediate': {
    key: 'Urgent & Not Immediate',
    label: 'Urgent & Not Immediate',
    shortLabel: 'Schedule',
    emoji: '🟡',
    color: '#eab308',
    dotBg: 'bg-yellow-500',
    badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    textColor: 'text-yellow-500',
  },
  'Not Urgent & Immediate': {
    key: 'Not Urgent & Immediate',
    label: 'Not Urgent & Immediate',
    shortLabel: 'Delegate',
    emoji: '🔵',
    color: '#3b82f6',
    dotBg: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    textColor: 'text-blue-500',
  },
  'Not Urgent & Not Immediate': {
    key: 'Not Urgent & Not Immediate',
    label: 'Not Urgent & Not Immediate',
    shortLabel: 'Backlog',
    emoji: '⚪',
    color: '#9ca3af',
    dotBg: 'bg-neutral-400',
    badgeClass: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    textColor: 'text-neutral-400',
  },
};

export interface VaultFile {
  id: string; // usually normalized path e.g. "projects/launch.md"
  path: string; // normalized path
  name: string; // filename e.g. "launch.md"
  title: string; // title (from frontmatter or stripped filename)
  extension: string; // e.g. "md", "png", "pdf"
  content: string; // raw markdown or text
  frontmatter: Record<string, any>; // parsed YAML frontmatter properties
  tags: string[]; // list of tags e.g. ["project", "release"]
  eisenhower?: EisenhowerQuadrant;
  isBinary: boolean;
  blob?: Blob; // stored binary blob for media
  mimeType?: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  vaultId: string;
  isTrash?: boolean;
  deletedAt?: number;
  originalPath?: string;
}

export interface BacklinkRecord {
  id: string; // `${sourcePath}::${targetTitle}`
  sourcePath: string;
  sourceTitle: string;
  targetTitle: string;
  targetPath?: string;
  snippet?: string;
  vaultId: string;
}

export interface TagRecord {
  name: string;
  count: number;
}

export interface VaultMetadata {
  key: string;
  value: any;
}

export interface WorkspaceRecord {
  id: string; // e.g. "default-vault" or "ws-123456"
  name: string; // "Local Vault" or directory name
  mode: 'indexeddb' | 'filesystem';
  handle?: any; // FileSystemDirectoryHandle stored natively in IndexedDB
  driveFolderId?: string;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export class KiteVaultDatabase extends Dexie {
  files!: Table<VaultFile, string>;
  backlinks!: Table<BacklinkRecord, string>;
  tags!: Table<TagRecord, string>;
  settings!: Table<VaultMetadata, string>;
  workspaces!: Table<WorkspaceRecord, string>;

  constructor() {
    super('KiteVaultDatabase');
    this.version(1).stores({
      files: 'id, path, name, title, extension, isBinary, *tags, vaultId, updatedAt',
      backlinks: 'id, sourcePath, sourceTitle, targetTitle, targetPath, vaultId',
      tags: 'name, count',
      settings: 'key',
    });
    this.version(2).stores({
      files: 'id, path, name, title, extension, isBinary, *tags, vaultId, updatedAt',
      backlinks: 'id, sourcePath, sourceTitle, targetTitle, targetPath, vaultId',
      tags: 'name, count',
      settings: 'key',
      workspaces: 'id, name, mode, updatedAt',
    });
  }
}

export const db = new KiteVaultDatabase();

/**
 * Seed initial starter notes if database is empty
 */
export async function seedInitialVaultIfEmpty() {
  const count = await db.files.count();
  if (count > 0) return;

  const initialNotes: Array<Omit<VaultFile, 'id'> & { id?: string }> = [
    {
      path: 'Welcome to Kite.md',
      name: 'Welcome to Kite.md',
      title: 'Welcome to Kite',
      extension: 'md',
      content: `---
title: Welcome to Kite
tags: [getting-started, guide]
status: Doing
priority: High
eisenhower: urgent_not_immediate
author: Kite Team
---

# Welcome to Kite Workspace 🪁

Kite is a high-performance, **local-first knowledge management workspace** modeled after **Obsidian** and **Notion**, powered by **Tiptap**, IndexedDB, and the File System Access API.

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
        title: 'Welcome to Kite',
        tags: ['getting-started', 'guide'],
        status: 'Doing',
        priority: 'High',
        eisenhower: 'urgent_not_immediate',
        author: 'Kite Team',
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
- Return to the main hub at [[Welcome to Kite]].`,
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

Referenced by [[Welcome to Kite]] and [[Product Roadmap 2026]].`,
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

  await db.transaction('rw', [db.files, db.backlinks, db.tags], async () => {
    for (const note of initialNotes) {
      const fileId = note.path;
      await db.files.put({
        ...note,
        id: fileId,
      });

      // Extract wikilinks for initial backlinks
      const matches = note.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const match of matches) {
        const rawTarget = match[1]?.trim();
        if (rawTarget) {
          const targetTitle = rawTarget.split('|')[0].trim();
          await db.backlinks.put({
            id: `${fileId}::${targetTitle}`,
            sourcePath: fileId,
            sourceTitle: note.title,
            targetTitle,
            snippet: note.content.slice(Math.max(0, match.index! - 30), match.index! + 60).replace(/\n/g, ' '),
            vaultId: 'default-vault',
          });
        }
      }

      // Record tags
      for (const tag of note.tags) {
        const existing = await db.tags.get(tag);
        await db.tags.put({
          name: tag,
          count: (existing?.count || 0) + 1,
        });
      }
    }
  });
}

/**
 * Move a note to ephemeral trash
 */
export async function moveToTrash(path: string): Promise<boolean> {
  const file = await db.files.get(path);
  if (!file) return false;

  await db.files.update(path, {
    isTrash: true,
    deletedAt: Date.now(),
    originalPath: path,
  });

  return true;
}

/**
 * Restore a note from ephemeral trash
 */
export async function restoreFromTrash(path: string): Promise<boolean> {
  const file = await db.files.get(path);
  if (!file) return false;

  await db.files.update(path, {
    isTrash: false,
    deletedAt: undefined,
  });

  return true;
}

/**
 * Permanently delete a note and prune associated backlinks and tag counts
 */
export async function deleteVaultFile(path: string): Promise<void> {
  const file = await db.files.get(path);
  if (file && file.tags && file.tags.length > 0) {
    for (const tag of file.tags) {
      const existing = await db.tags.get(tag);
      if (existing) {
        const newCount = existing.count - 1;
        if (newCount <= 0) {
          await db.tags.delete(tag);
        } else {
          await db.tags.put({ name: tag, count: newCount });
        }
      }
    }
  }

  // Delete note from files table
  await db.files.delete(path);
  // Also clean up by id if id is different
  if (file?.id && file.id !== path) {
    await db.files.delete(file.id);
  }

  // Prune outgoing and incoming backlinks
  await db.backlinks.where('sourcePath').equals(path).delete();
  const title = file?.title || path.replace(/\.[^/.]+$/, '').split('/').pop() || '';
  if (title) {
    await db.backlinks.where('targetTitle').equalsIgnoreCase(title).delete();
  }
}

/**
 * Get all files currently in ephemeral trash
 */
export async function getTrashFiles(): Promise<VaultFile[]> {
  const allFiles = await db.files.toArray();
  return allFiles.filter((f) => f.isTrash);
}

/**
 * Empty all items from trash permanently
 */
export async function emptyTrash(): Promise<number> {
  const trashed = await getTrashFiles();
  for (const file of trashed) {
    await deleteVaultFile(file.path);
  }
  return trashed.length;
}

/**
 * Auto-purge expired trash files based on retention days
 */
export async function purgeExpiredTrash(retentionDays = 30): Promise<number> {
  const trashed = await getTrashFiles();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let purgedCount = 0;

  for (const file of trashed) {
    if (file.deletedAt && file.deletedAt < cutoff) {
      await deleteVaultFile(file.path);
      purgedCount++;
    }
  }

  return purgedCount;
}

