import { db } from '@/src/lib/storage/db';

export interface VaultMatchOccurrence {
  index: number;
  length: number;
  line: number;
  preview: string;
  replacementText: string;
}

export interface FileMatchGroup {
  noteId: string;
  noteTitle: string;
  notePath: string;
  checked: boolean;
  matches: VaultMatchOccurrence[];
  originalContent: string;
}

export interface FindReplaceOptions {
  workspaceId: string;
  query: string;
  replacement: string;
  isRegex: boolean;
  matchCase: boolean;
  wholeWord: boolean;
  scopeFolder?: string;
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSearchRegex(options: Pick<FindReplaceOptions, 'query' | 'isRegex' | 'matchCase' | 'wholeWord'>): RegExp | null {
  if (!options.query) return null;
  try {
    let pattern = options.isRegex ? options.query : escapeRegExp(options.query);
    if (options.wholeWord) {
      pattern = `\\b(?:${pattern})\\b`;
    }
    const flags = options.matchCase ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

export async function scanVaultForMatches(options: FindReplaceOptions): Promise<FileMatchGroup[]> {
  const { workspaceId, query, replacement, scopeFolder } = options;
  if (!query) return [];

  const regex = buildSearchRegex(options);
  if (!regex) return [];

  const allFiles = await db.files.toArray();
  const notes = allFiles.filter((f) => {
    if (f.isTrash || f.isBinary) return false;
    if (workspaceId && workspaceId !== 'default-vault' && f.vaultId && f.vaultId !== workspaceId) {
      return false;
    }
    if (scopeFolder && !f.path.startsWith(scopeFolder)) {
      return false;
    }
    return true;
  });

  const results: FileMatchGroup[] = [];

  for (const note of notes) {
    const content = note.content || '';
    if (!content) continue;

    const matches: VaultMatchOccurrence[] = [];
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];
      if (matchText.length === 0) {
        // Prevent infinite loop on 0-length matches
        regex.lastIndex++;
        continue;
      }

      // Calculate replacement text with capture group substitution
      const replacementText = matchText.replace(regex, replacement);

      // Line number calculation
      const linesBefore = content.substring(0, matchIndex).split('\n');
      const lineNumber = linesBefore.length;

      // Extract line preview
      const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
      let lineEnd = content.indexOf('\n', matchIndex + matchText.length);
      if (lineEnd === -1) lineEnd = content.length;
      const preview = content.substring(lineStart, lineEnd);

      matches.push({
        index: matchIndex,
        length: matchText.length,
        line: lineNumber,
        preview,
        replacementText,
      });

      if (!regex.global) break;
    }

    if (matches.length > 0) {
      results.push({
        noteId: note.id || note.path,
        noteTitle: note.title || note.name.replace(/\.[^/.]+$/, ''),
        notePath: note.path,
        checked: true,
        matches,
        originalContent: content,
      });
    }
  }

  return results;
}

export async function executeBatchReplace(
  groups: FileMatchGroup[],
  replacementPattern: string,
  options: FindReplaceOptions
): Promise<{ success: boolean; modifiedCount: number; snapshot: Map<string, string> }> {
  const snapshot = new Map<string, string>();
  let modifiedCount = 0;

  const checkedGroups = groups.filter((g) => g.checked && g.matches.length > 0);
  if (checkedGroups.length === 0) {
    return { success: true, modifiedCount: 0, snapshot };
  }

  const regex = buildSearchRegex(options);
  if (!regex) return { success: false, modifiedCount: 0, snapshot };

  await db.transaction('rw', db.files, async () => {
    for (const group of checkedGroups) {
      snapshot.set(group.noteId, group.originalContent);
      const updatedContent = group.originalContent.replace(regex, replacementPattern);
      await db.files.update(group.noteId, {
        content: updatedContent,
        updatedAt: Date.now(),
      });
      modifiedCount++;
    }
  });

  return { success: true, modifiedCount, snapshot };
}

export async function executeSingleMatchReplace(
  noteId: string,
  matchIndex: number,
  matchLength: number,
  replacementText: string
): Promise<{ success: boolean; snapshot: Map<string, string> }> {
  const snapshot = new Map<string, string>();
  const file = await db.files.get(noteId);
  if (!file) return { success: false, snapshot };

  snapshot.set(noteId, file.content);
  const before = file.content.substring(0, matchIndex);
  const after = file.content.substring(matchIndex + matchLength);
  const updatedContent = before + replacementText + after;

  await db.files.update(noteId, {
    content: updatedContent,
    updatedAt: Date.now(),
  });

  return { success: true, snapshot };
}

export async function rollbackBatchReplace(snapshot: Map<string, string>): Promise<void> {
  await db.transaction('rw', db.files, async () => {
    for (const [noteId, originalContent] of snapshot.entries()) {
      await db.files.update(noteId, {
        content: originalContent,
        updatedAt: Date.now(),
      });
    }
  });
}
