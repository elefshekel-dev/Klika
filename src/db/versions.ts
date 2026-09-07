// גרסאות — צילומי מצב של תוכן רסיס. נשמרים 30 האחרונים לכל רסיס. רשת ביטחון,
// לא היסטוריית עריכה מלאה: שומרים לכל היותר צילום אחד לכל פרק זמן קצר.

import { db } from './db';
import type { Version } from './types';
import { newId } from '@/lib/id';
import { getDeviceId } from '@/lib/device';

const MAX_VERSIONS = 30;
const THROTTLE_MS = 90_000; // צילום אחד ל-90 שניות לכל היותר תוך כדי עריכה

/** הגרסה החדשה ביותר של רסיס. */
async function newestVersion(fragmentId: string): Promise<Version | undefined> {
  const list = await db.versions.where('[fragmentId+savedAt]').between(
    [fragmentId, -Infinity],
    [fragmentId, Infinity],
  ).toArray();
  return list.sort((a, b) => b.savedAt - a.savedAt)[0];
}

/** גוזם ל-30 הגרסאות האחרונות לרסיס. */
async function prune(fragmentId: string): Promise<void> {
  const list = await db.versions.where('fragmentId').equals(fragmentId).toArray();
  if (list.length <= MAX_VERSIONS) return;
  list.sort((a, b) => b.savedAt - a.savedAt);
  const toDelete = list.slice(MAX_VERSIONS).map((v) => v.id);
  await db.versions.bulkDelete(toDelete);
}

/**
 * שומר צילום מצב אם צריך. force=true שומר תמיד (אלא אם התוכן זהה לחדש ביותר);
 * אחרת שומר רק אם עבר מספיק זמן מהצילום האחרון והתוכן השתנה.
 */
export async function snapshotVersion(
  fragmentId: string,
  content: string,
  force = false,
): Promise<void> {
  if (content.trim() === '') return;
  const newest = await newestVersion(fragmentId);
  if (newest && newest.content === content) return;
  if (!force && newest && Date.now() - newest.savedAt < THROTTLE_MS) return;

  await db.versions.add({
    id: newId(),
    fragmentId,
    content,
    savedAt: Date.now(),
    deviceId: getDeviceId(),
  });
  await prune(fragmentId);
}

/** רשימת הגרסאות של רסיס, מהחדשה לישנה. */
export async function listVersions(fragmentId: string): Promise<Version[]> {
  const list = await db.versions.where('fragmentId').equals(fragmentId).toArray();
  return list.sort((a, b) => b.savedAt - a.savedAt);
}

/**
 * משחזר תוכן מגרסה. שומר קודם צילום של המצב הנוכחי (כדי שהשחזור עצמו הפיך),
 * ואז כותב את התוכן של הגרסה לרסיס.
 */
export async function restoreVersion(fragmentId: string, versionId: string): Promise<void> {
  const [frag, version] = await Promise.all([
    db.fragments.get(fragmentId),
    db.versions.get(versionId),
  ]);
  if (!frag || !version) return;
  await snapshotVersion(fragmentId, frag.content, true);
  await db.fragments.update(fragmentId, {
    content: version.content,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}
