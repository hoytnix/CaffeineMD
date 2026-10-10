import { useMemo } from 'react';
import { VaultFile, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';

export type { EisenhowerQuadrant };

export function useDatabaseSchema(
  files: VaultFile[],
  filterFolder: string,
  filterTag: string,
  searchFilter: string
) {
  const { folders, tags, columns } = useMemo(() => {
    const folderSet = new Set<string>();
    const tagSet = new Set<string>();
    const propKeys = new Set<string>();

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
      }
    });

    return {
      folders: Array.from(folderSet),
      tags: Array.from(tagSet),
      columns: Array.from(propKeys),
    };
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (filterFolder !== 'all') {
        if (!f.path.startsWith(`${filterFolder}/`)) return false;
      }
      if (filterTag !== 'all') {
        if (!f.tags?.includes(filterTag)) return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchTitle = (f.title || f.name).toLowerCase().includes(q);
        const matchContent = f.content?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    });
  }, [files, filterFolder, filterTag, searchFilter]);

  return {
    folders,
    tags,
    columns,
    filteredFiles,
  };
}
