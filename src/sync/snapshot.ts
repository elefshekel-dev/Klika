// המרה בין מסד הנתונים המקומי לבין Snapshot (fragments-data.json), ולהפך.

import { db } from '@/db/db';
import { getDeviceId } from '@/lib/device';
import type { Snapshot } from './types';
import type { MergeResult } from './types';

export const SNAPSHOT_VERSION = 1;

/** בונה תמונת מצב מלאה מהמסד המקומי. */
export async function buildSnapshot(): Promise<Snapshot> {
  const [fragments, tags, collections, versions] = await Promise.all([
    db.fragments.toArray(),
    db.tags.toArray(),
    db.collections.toArray(),
    db.versions.toArray(),
  ]);
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: Date.now(),
    deviceId: getDeviceId(),
    fragments,
    tags,
    collections,
    versions,
  };
}

/** תמונת מצב ריקה — כשעדיין אין קובץ ב-Drive. */
export function emptySnapshot(): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: 0,
    deviceId: getDeviceId(),
    fragments: [],
    tags: [],
    collections: [],
    versions: [],
  };
}

/** כותב את תוצאת המיזוג למסד המקומי (replace-all בטרנזקציה אחת). */
export async function applyMerge(result: MergeResult): Promise<void> {
  await db.transaction('rw', db.fragments, db.tags, db.collections, db.versions, async () => {
    await Promise.all([
      db.fragments.clear(),
      db.tags.clear(),
      db.collections.clear(),
      db.versions.clear(),
    ]);
    await Promise.all([
      db.fragments.bulkPut(result.fragments),
      db.tags.bulkPut(result.tags),
      db.collections.bulkPut(result.collections),
      db.versions.bulkPut(result.versions),
    ]);
  });
}

/** בונה Snapshot מתוצאת מיזוג — להעלאה חזרה ל-Drive. */
export function snapshotFromMerge(result: MergeResult): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: Date.now(),
    deviceId: getDeviceId(),
    fragments: result.fragments,
    tags: result.tags,
    collections: result.collections,
    versions: result.versions,
  };
}
