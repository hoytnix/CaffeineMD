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
