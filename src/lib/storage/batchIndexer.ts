import { db, VaultFile, BacklinkRecord } from './db';

export async function commitIngestionBatch(
  parsedFiles: VaultFile[],
  backlinksToInsert: BacklinkRecord[],
  tagCounts: Map<string, number>
): Promise<void> {
  // Commit everything in a single fast IndexedDB transaction
  await db.transaction('rw', [db.files, db.backlinks, db.tags], async () => {
    // 1. Bulk insert/put files
    for (const file of parsedFiles) {
      await db.files.put(file);
    }

    // 2. Clear old backlinks for these files and put new ones
    for (const bl of backlinksToInsert) {
      await db.backlinks.put(bl);
    }

    // 3. Update tag counts
    for (const [tag, count] of tagCounts.entries()) {
      const existing = await db.tags.get(tag);
      await db.tags.put({
        name: tag,
        count: (existing?.count || 0) + count,
      });
    }
  });
}
