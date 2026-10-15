import { db } from './schema';

export interface FolderMoveRecord {
  oldPath: string;
  newPath: string;
  timestamp: number;
}

const PENDING_MOVES_KEY = 'pending_folder_moves';

/**
 * Record a folder move/rename so that cloud sync engines can reparent
 * remote folder hierarchies directly instead of re-downloading or re-uploading.
 */
export async function recordFolderMove(oldPath: string, newPath: string): Promise<void> {
  const cleanOld = oldPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  const cleanNew = newPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

  try {
    const existing = await db.settings.get(PENDING_MOVES_KEY);
    const moves: FolderMoveRecord[] = Array.isArray(existing?.value) ? existing.value : [];
    moves.push({ oldPath: cleanOld, newPath: cleanNew, timestamp: Date.now() });
    await db.settings.put({ key: PENDING_MOVES_KEY, value: moves });
  } catch (err) {
    console.warn('[pendingMoves] Failed to record folder move:', err);
  }
}

/**
 * Retrieve all pending folder move records awaiting cloud synchronization.
 */
export async function getPendingFolderMoves(): Promise<FolderMoveRecord[]> {
  try {
    const record = await db.settings.get(PENDING_MOVES_KEY);
    return Array.isArray(record?.value) ? record.value : [];
  } catch {
    return [];
  }
}

/**
 * Clear processed folder move records after cloud sync reconciliation completes.
 */
export async function clearPendingFolderMoves(): Promise<void> {
  try {
    await db.settings.delete(PENDING_MOVES_KEY);
  } catch (err) {
    console.warn('[pendingMoves] Failed to clear pending folder moves:', err);
  }
}
