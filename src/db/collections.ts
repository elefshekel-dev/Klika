// פעולות על אסופות. אסופה היא רשימה מסודרת של רסיסים קיימים. רסיס אחד יכול
// להיות בכמה אסופות בו-זמנית (ריבוי חברות). מחיקת אסופה אינה מוחקת רסיסים.

import { db } from './db';
import type { Collection } from './types';
import { newId } from '@/lib/id';
import { getDeviceId } from '@/lib/device';

/** כל האסופות הפעילות, ממוינות לפי עדכון אחרון. */
export async function listCollections(): Promise<Collection[]> {
  const all = await db.collections.toArray();
  return all.filter((c) => !c.isDeleted).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getCollection(id: string): Promise<Collection | undefined> {
  return db.collections.get(id);
}

export async function createCollection(name: string, description = ''): Promise<Collection> {
  const now = Date.now();
  const collection: Collection = {
    id: newId(),
    name: name.trim() || 'אסופה חדשה',
    description,
    fragmentIds: [],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deviceId: getDeviceId(),
  };
  await db.collections.add(collection);
  return collection;
}

export async function renameCollection(id: string, name: string): Promise<void> {
  await db.collections.update(id, { name: name.trim(), updatedAt: Date.now(), deviceId: getDeviceId() });
}

export async function updateCollectionDescription(id: string, description: string): Promise<void> {
  await db.collections.update(id, { description, updatedAt: Date.now(), deviceId: getDeviceId() });
}

/** מחיקה רכה של האסופה. הרסיסים עצמם נשארים. */
export async function deleteCollection(id: string): Promise<void> {
  await db.collections.update(id, { isDeleted: true, updatedAt: Date.now(), deviceId: getDeviceId() });
}

/** מוסיף רסיס לסוף האסופה (אם עוד לא בתוכה). */
export async function addFragmentToCollection(collectionId: string, fragmentId: string): Promise<void> {
  const c = await db.collections.get(collectionId);
  if (!c || c.fragmentIds.includes(fragmentId)) return;
  await db.collections.update(collectionId, {
    fragmentIds: [...c.fragmentIds, fragmentId],
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

export async function removeFragmentFromCollection(collectionId: string, fragmentId: string): Promise<void> {
  const c = await db.collections.get(collectionId);
  if (!c) return;
  await db.collections.update(collectionId, {
    fragmentIds: c.fragmentIds.filter((id) => id !== fragmentId),
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

/** קובע סדר חדש לרסיסים באסופה (אחרי גרירה). */
export async function reorderCollection(collectionId: string, fragmentIds: string[]): Promise<void> {
  await db.collections.update(collectionId, {
    fragmentIds,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

/** אילו אסופות מכילות רסיס נתון — לתצוגת "הוספה לאסופה". */
export async function collectionsForFragment(fragmentId: string): Promise<Set<string>> {
  const all = await listCollections();
  return new Set(all.filter((c) => c.fragmentIds.includes(fragmentId)).map((c) => c.id));
}
