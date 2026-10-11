import { db, VaultFile } from '../schema';
import { INITIAL_VAULT_NOTES } from '../seedData';

/**
 * Fetch a single note by normalized path
 */
export async function getNote(path: string): Promise<VaultFile | undefined> {
  return db.files.get(path);
}

/**
 * Save or update a note record
 */
export async function saveNote(note: VaultFile): Promise<void> {
  await db.files.put({
    ...note,
    id: note.id || note.path,
    updatedAt: note.updatedAt || Date.now(),
  });
}

/**
 * List all non-trashed notes in a given workspace (or all notes if no vaultId)
 */
export async function listNotes(vaultId?: string): Promise<VaultFile[]> {
  const all = await db.files.toArray();
  return all.filter((f) => {
    if (f.isTrash) return false;
    if (!vaultId) return true;
    if (vaultId === 'default-vault') return !f.vaultId || f.vaultId === 'default-vault';
    return f.vaultId === vaultId;
  });
}

/**
 * Bulk upsert notes within an atomic Dexie transaction
 */
export async function bulkUpsertNotes(notes: VaultFile[]): Promise<void> {
  if (notes.length === 0) return;
  await db.transaction('rw', db.files, async () => {
    for (const note of notes) {
      await db.files.put({
        ...note,
        id: note.id || note.path,
      });
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

/**
 * Seed starter knowledge base notes if database is empty
 */
export async function seedInitialVaultIfEmpty(): Promise<void> {
  const count = await db.files.count();
  if (count > 0) return;

  await db.transaction('rw', [db.files, db.backlinks, db.tags], async () => {
    for (const note of INITIAL_VAULT_NOTES) {
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
