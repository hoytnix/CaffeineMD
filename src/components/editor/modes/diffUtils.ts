import { diffLines, Change } from 'diff';

export interface SplitLine {
  left: { num: number | null; text: string; type: 'normal' | 'removed' | 'empty' };
  right: { num: number | null; text: string; type: 'normal' | 'added' | 'empty' };
}

export interface UnifiedLine {
  oldNum: number | null;
  newNum: number | null;
  text: string;
  type: 'normal' | 'added' | 'removed';
}

export interface DiffStats {
  changes: Change[];
  addedCount: number;
  removedCount: number;
  hasChanges: boolean;
}

export function computeDiffStats(saved: string, unsaved: string): DiffStats {
  const diffs = diffLines(saved || '', unsaved || '');
  let added = 0;
  let removed = 0;
  for (const c of diffs) {
    if (c.added) added += c.count || 0;
    if (c.removed) removed += c.count || 0;
  }
  return {
    changes: diffs,
    addedCount: added,
    removedCount: removed,
    hasChanges: added > 0 || removed > 0,
  };
}

export function computeUnifiedLines(changes: Change[]): UnifiedLine[] {
  const result: UnifiedLine[] = [];
  let oldNum = 1;
  let newNum = 1;

  for (const c of changes) {
    const lines = c.value.replace(/\n$/, '').split('\n');
    for (const text of lines) {
      if (c.removed) {
        result.push({ oldNum: oldNum++, newNum: null, text, type: 'removed' });
      } else if (c.added) {
        result.push({ oldNum: null, newNum: newNum++, text, type: 'added' });
      } else {
        result.push({ oldNum: oldNum++, newNum: newNum++, text, type: 'normal' });
      }
    }
  }
  return result;
}

export function computeSplitLines(changes: Change[]): SplitLine[] {
  const result: SplitLine[] = [];
  let leftNum = 1;
  let rightNum = 1;

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    const lines = c.value.replace(/\n$/, '').split('\n');

    if (!c.added && !c.removed) {
      for (const line of lines) {
        result.push({
          left: { num: leftNum++, text: line, type: 'normal' },
          right: { num: rightNum++, text: line, type: 'normal' },
        });
      }
    } else if (c.removed) {
      const next = changes[i + 1];
      if (next && next.added) {
        const nextLines = next.value.replace(/\n$/, '').split('\n');
        const max = Math.max(lines.length, nextLines.length);
        for (let j = 0; j < max; j++) {
          result.push({
            left:
              j < lines.length
                ? { num: leftNum++, text: lines[j], type: 'removed' }
                : { num: null, text: '', type: 'empty' },
            right:
              j < nextLines.length
                ? { num: rightNum++, text: nextLines[j], type: 'added' }
                : { num: null, text: '', type: 'empty' },
          });
        }
        i++;
      } else {
        for (const line of lines) {
          result.push({
            left: { num: leftNum++, text: line, type: 'removed' },
            right: { num: null, text: '', type: 'empty' },
          });
        }
      }
    } else if (c.added) {
      for (const line of lines) {
        result.push({
          left: { num: null, text: '', type: 'empty' },
          right: { num: rightNum++, text: line, type: 'added' },
        });
      }
    }
  }
  return result;
}
