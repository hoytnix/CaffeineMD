import { useMemo } from 'react';
import { VaultFile, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';

export type { EisenhowerQuadrant };

export interface NoteProperties {
  title: string;
  tags: string[];
  status: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | string;
  author: string;
  eisenhower: 'Urgent & Immediate' | 'Urgent & Not Immediate' | 'Not Urgent & Immediate' | 'Not Urgent & Not Immediate';
  [key: string]: any;
}

export const DEFAULT_NOTE_PROPERTIES: NoteProperties = {
  title: '',
  tags: [],
  status: 'Draft',
  author: '',
  eisenhower: 'Not Urgent & Not Immediate',
};

export const DEFAULT_SCHEMA_COLUMNS = ['title', 'tags', 'status', 'author', 'eisenhower'] as const;

export const DEFAULT_STATUS_OPTIONS = ['Draft', 'In Progress', 'Completed', 'Archived'] as const;

export const DEFAULT_EISENHOWER_OPTIONS = [
  'Urgent & Immediate',
  'Urgent & Not Immediate',
  'Not Urgent & Immediate',
  'Not Urgent & Not Immediate',
] as const;

export function useDatabaseSchema(
  files: VaultFile[],
  filterFolder: string = 'all',
  filterTag: string = 'all',
  searchFilter: string = '',
  filterStatus: string = 'all',
  filterEisenhower: string = 'all',
  sortBy: string = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const { folders, tags, columns, statuses, authors } = useMemo(() => {
    const folderSet = new Set<string>();
    const tagSet = new Set<string>();
    const propKeys = new Set<string>(['status', 'author']);
    const statusSet = new Set<string>(DEFAULT_STATUS_OPTIONS);
    const authorSet = new Set<string>();

    files.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        folderSet.add(parts[0]);
      }
      f.tags?.forEach((t) => tagSet.add(t));
      if (f.frontmatter) {
        Object.keys(f.frontmatter).forEach((k) => {
          if (!['title', 'tags', 'eisenhower'].includes(k)) {
            propKeys.add(k);
          }
        });

        if (f.frontmatter.status) {
          statusSet.add(String(f.frontmatter.status));
        }
        if (f.frontmatter.author) {
          authorSet.add(String(f.frontmatter.author));
        }
      }
    });

    return {
      folders: Array.from(folderSet),
      tags: Array.from(tagSet),
      columns: Array.from(propKeys),
      statuses: Array.from(statusSet),
      authors: Array.from(authorSet).filter(Boolean),
    };
  }, [files]);

  const filteredFiles = useMemo(() => {
    const list = files.filter((f) => {
      if (filterFolder !== 'all') {
        if (!f.path.startsWith(`${filterFolder}/`)) return false;
      }
      if (filterTag !== 'all') {
        if (!f.tags?.includes(filterTag)) return false;
      }
      if (filterStatus !== 'all') {
        const fileStatus = f.frontmatter?.status || 'Draft';
        if (String(fileStatus).toLowerCase() !== filterStatus.toLowerCase()) return false;
      }
      if (filterEisenhower !== 'all') {
        const rawEisenhower = f.eisenhower || f.frontmatter?.eisenhower;
        const normalized = normalizeEisenhower(rawEisenhower);
        if (normalized !== filterEisenhower) return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchTitle = (f.title || f.name).toLowerCase().includes(q);
        const matchContent = f.content?.toLowerCase().includes(q);
        const matchAuthor = String(f.frontmatter?.author || '').toLowerCase().includes(q);
        const matchStatus = String(f.frontmatter?.status || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchAuthor && !matchStatus) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title' || sortBy === 'name') {
        comparison = (a.title || a.name).localeCompare(b.title || b.name);
      } else if (sortBy === 'status') {
        const sa = String(a.frontmatter?.status || 'Draft');
        const sb = String(b.frontmatter?.status || 'Draft');
        comparison = sa.localeCompare(sb);
      } else if (sortBy === 'author') {
        const aa = String(a.frontmatter?.author || '');
        const ab = String(b.frontmatter?.author || '');
        comparison = aa.localeCompare(ab);
      } else if (sortBy === 'eisenhower') {
        const ea = normalizeEisenhower(a.eisenhower || a.frontmatter?.eisenhower);
        const eb = normalizeEisenhower(b.eisenhower || b.frontmatter?.eisenhower);
        comparison = ea.localeCompare(eb);
      } else if (sortBy === 'createdAt') {
        comparison = (a.createdAt || 0) - (b.createdAt || 0);
      } else if (sortBy === 'updatedAt') {
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0);
      } else {
        const va = a.frontmatter?.[sortBy] ?? '';
        const vb = b.frontmatter?.[sortBy] ?? '';
        comparison = String(va).localeCompare(String(vb));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, filterFolder, filterTag, filterStatus, filterEisenhower, searchFilter, sortBy, sortOrder]);

  return {
    folders,
    tags,
    columns,
    defaultColumns: DEFAULT_SCHEMA_COLUMNS,
    statuses,
    authors,
    filteredFiles,
  };
}
