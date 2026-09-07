// פעולות על רסיסים. שכבת גישה דקה מעל Dexie.

import { db } from './db';
import type { Fragment } from './types';
import { newId } from '@/lib/id';
import { getDeviceId } from '@/lib/device';

/** יוצר רסיס ריק חדש ומחזיר אותו. נקודת הכניסה של הלכידה. */
export async function createFragment(): Promise<Fragment> {
  const now = Date.now();
  const fragment: Fragment = {
    id: newId(),
    content: '',
    tagIds: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    isDeleted: false,
    deviceId: getDeviceId(),
  };
  await db.fragments.add(fragment);
  return fragment;
}

/** מעדכן את תוכן הרסיס. שבירות שורה נשמרות כפי שהן — אין trim, אין format. */
export async function updateFragmentContent(id: string, content: string): Promise<void> {
  await db.fragments.update(id, {
    content,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

/** מעדכן כותרת (אופציונלית — אף פעם לא נדרשת מהמשתמשת). */
export async function updateFragmentTitle(id: string, title: string): Promise<void> {
  await db.fragments.update(id, {
    title: title || undefined,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

/**
 * מוחק בשקט רסיס ריק שננטש. נחשב ריק אם אין תוכן (אחרי trim לבדיקה בלבד)
 * ואין לו תגיות. מחיקה פיזית — רסיס ריק מעולם לא "היה", אין טעם ב-tombstone.
 */
export async function deleteFragmentIfEmpty(id: string): Promise<boolean> {
  const f = await db.fragments.get(id);
  if (!f) return false;
  if (f.content.trim() === '' && f.tagIds.length === 0) {
    await db.fragments.delete(id);
    return true;
  }
  return false;
}

/** מחיקה רכה (tombstone) — נשמר לסנכרון. */
export async function softDeleteFragment(id: string): Promise<void> {
  await db.fragments.update(id, {
    isDeleted: true,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

/** שחזור רסיס שנמחק רכות. */
export async function restoreFragment(id: string): Promise<void> {
  await db.fragments.update(id, {
    isDeleted: false,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

export async function togglePin(id: string): Promise<void> {
  const f = await db.fragments.get(id);
  if (!f) return;
  await db.fragments.update(id, {
    isPinned: !f.isPinned,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  });
}

export async function getFragment(id: string): Promise<Fragment | undefined> {
  return db.fragments.get(id);
}
