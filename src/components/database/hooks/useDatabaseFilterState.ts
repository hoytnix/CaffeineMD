'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/storage/db';
import { useDatabaseSchema } from '@/src/hooks/useDatabaseSchema';

/**
 * Manages live IndexedDB file queries, multi-filter state (folder, tag, status, Eisenhower),
 * search query, sorting state, and derived schema projections for DatabaseView.
 */
export function useDatabaseFilterState(activeWorkspaceId: string) {
  const rawFiles = useLiveQuery(() => db.files.filter((f) => !f.isBinary && !f.isTrash).toArray());
  const files = useMemo(() => {
    const list = rawFiles ?? [];
    return list.filter((f) => {
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [rawFiles, activeWorkspaceId]);

  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEisenhower, setFilterEisenhower] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { folders, tags, columns, statuses, filteredFiles } = useDatabaseSchema(
    files,
    filterFolder,
    filterTag,
    searchFilter,
    filterStatus,
    filterEisenhower,
    sortBy,
    sortOrder
  );

  return {
    filterFolder,
    setFilterFolder,
    filterTag,
    setFilterTag,
    searchFilter,
    setSearchFilter,
    filterStatus,
    setFilterStatus,
    filterEisenhower,
    setFilterEisenhower,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    folders,
    tags,
    columns,
    statuses,
    filteredFiles,
  };
}
