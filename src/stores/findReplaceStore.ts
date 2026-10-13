import { create } from 'zustand';
import {
  FileMatchGroup,
  scanVaultForMatches,
  executeBatchReplace,
  executeSingleMatchReplace,
  rollbackBatchReplace,
  FindReplaceOptions,
} from '@/src/lib/search/vaultFindReplace';
import { useWorkspaceStore } from './workspaceStore';

interface FindReplaceState {
  isOpen: boolean;
  query: string;
  replacement: string;
  isRegex: boolean;
  matchCase: boolean;
  wholeWord: boolean;
  scopeFolder?: string;
  results: FileMatchGroup[];
  isSearching: boolean;
  lastSnapshot: Map<string, string> | null;
  activeMatchCursor: number; // Flat match index across active search

  setOpen: (open: boolean) => void;
  setSearchParams: (params: Partial<Pick<FindReplaceState, 'query' | 'replacement' | 'isRegex' | 'matchCase' | 'wholeWord' | 'scopeFolder'>>) => void;
  setResults: (results: FileMatchGroup[]) => void;
  toggleFileChecked: (noteId: string) => void;
  setAllChecked: (checked: boolean) => void;
  setSnapshot: (snapshot: Map<string, string> | null) => void;
  performSearch: () => Promise<void>;
  replaceInCheckedFiles: () => Promise<number>;
  replaceAll: () => Promise<number>;
  replaceNextMatch: () => Promise<boolean>;
  undoLastBatch: () => Promise<void>;
}

export const useFindReplaceStore = create<FindReplaceState>((set, get) => ({
  isOpen: false,
  query: '',
  replacement: '',
  isRegex: false,
  matchCase: false,
  wholeWord: false,
  scopeFolder: undefined,
  results: [],
  isSearching: false,
  lastSnapshot: null,
  activeMatchCursor: 0,

  setOpen: (open) => {
    set({ isOpen: open });
    if (open && get().query) {
      get().performSearch();
    }
  },

  setSearchParams: (params) => {
    set(params);
    get().performSearch();
  },

  setResults: (results) => set({ results, activeMatchCursor: 0 }),

  toggleFileChecked: (noteId) =>
    set((state) => ({
      results: state.results.map((r) =>
        r.noteId === noteId ? { ...r, checked: !r.checked } : r
      ),
    })),

  setAllChecked: (checked) =>
    set((state) => ({
      results: state.results.map((r) => ({ ...r, checked })),
    })),

  setSnapshot: (lastSnapshot) => set({ lastSnapshot }),

  performSearch: async () => {
    const { query, replacement, isRegex, matchCase, wholeWord, scopeFolder } = get();
    if (!query) {
      set({ results: [], isSearching: false, activeMatchCursor: 0 });
      return;
    }

    set({ isSearching: true });
    try {
      const workspaceId = useWorkspaceStore.getState().activeWorkspaceId || 'default-vault';
      const results = await scanVaultForMatches({
        workspaceId,
        query,
        replacement,
        isRegex,
        matchCase,
        wholeWord,
        scopeFolder,
      });
      set({ results, isSearching: false, activeMatchCursor: 0 });
    } catch (err) {
      console.error('Vault find scan failed:', err);
      set({ results: [], isSearching: false });
    }
  },

  replaceInCheckedFiles: async () => {
    const { results, replacement, query, isRegex, matchCase, wholeWord, scopeFolder } = get();
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId || 'default-vault';
    const options: FindReplaceOptions = {
      workspaceId,
      query,
      replacement,
      isRegex,
      matchCase,
      wholeWord,
      scopeFolder,
    };

    const res = await executeBatchReplace(results, replacement, options);
    if (res.success && res.modifiedCount > 0) {
      set({ lastSnapshot: res.snapshot });
      await get().performSearch();
    }
    return res.modifiedCount;
  },

  replaceAll: async () => {
    get().setAllChecked(true);
    return get().replaceInCheckedFiles();
  },

  replaceNextMatch: async () => {
    const { results } = get();
    // Find first checked group with matches
    const firstGroup = results.find((g) => g.checked && g.matches.length > 0);
    if (!firstGroup || firstGroup.matches.length === 0) return false;

    const firstMatch = firstGroup.matches[0];
    const res = await executeSingleMatchReplace(
      firstGroup.noteId,
      firstMatch.index,
      firstMatch.length,
      firstMatch.replacementText
    );

    if (res.success) {
      set({ lastSnapshot: res.snapshot });
      await get().performSearch();
      return true;
    }
    return false;
  },

  undoLastBatch: async () => {
    const { lastSnapshot } = get();
    if (lastSnapshot && lastSnapshot.size > 0) {
      await rollbackBatchReplace(lastSnapshot);
      set({ lastSnapshot: null });
      await get().performSearch();
    }
  },
}));
