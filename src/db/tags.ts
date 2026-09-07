// פעולות על תגיות. תגיות נוצרות תוך כדי הקלדה — אין ניהול מראש, אין טקסונומיה.

import { db } from './db';
import type { Tag } from './types';
import { newId } from '@/lib/id';
import { getDeviceId } from '@/lib/device';
import { normalizeHebrew } from '@/lib/hebrew';

// פלטת צבעים נעימה. תגית חדשה מקבלת צבע מהפלטה לפי סדר יצירה.
export const TAG_COLORS = [
  '#b45309', // ענבר
  '#0f766e', // טורקיז
  '#7c3aed', // סגול
  '#be123c', // ורוד-אדום
  '#2563eb', // כחול
  '#65a30d', // ירוק-זית
  '#c2410c', // כתום
  '#0e7490', // תכלת
] as const;

/** כל התגיות הפעילות, ממוינות לפי שכיחות שימוש (יורד) ואז לפי שם. */
export async function listTags(): Promise<Tag[]> {
  const all = await db.tags.toArray();
  return all
    .filter((t) => !t.isDeleted)
    .sort((a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name, 'he'));
}

/**
 * מוצא תגית קיימת לפי שם (השוואה מנורמלת — מתעלמת מניקוד/רישיות) או יוצר חדשה.
 * מחזיר את מזהה התגית.
 */
export async function getOrCreateTag(rawName: string): Promise<Tag> {
  const name = rawName.trim();
  if (!name) throw new Error('שם תגית ריק');

  const norm = normalizeHebrew(name);
  const all = await db.tags.toArray();
  const existing = all.find((t) => !t.isDeleted && normalizeHebrew(t.name) === norm);
  if (existing) return existing;

  const activeCount = all.filter((t) => !t.isDeleted).length;
  const now = Date.now();
  const tag: Tag = {
    id: newId(),
    name,
    color: TAG_COLORS[activeCount % TAG_COLORS.length],
    createdAt: now,
    updatedAt: now,
    useCount: 0,
    isDeleted: false,
    deviceId: getDeviceId(),
  };
  await db.tags.add(tag);
  return tag;
}

/** מגדיר את קבוצת התגיות של רסיס ומעדכן את מוני השימוש בהתאם. */
export async function setFragmentTags(fragmentId: string, tagIds: string[]): Promise<void> {
  await db.transaction('rw', db.fragments, db.tags, async () => {
    const frag = await db.fragments.get(fragmentId);
    if (!frag) return;
    const before = new Set(frag.tagIds);
    const after = new Set(tagIds);

    await db.fragments.update(fragmentId, {
      tagIds,
      updatedAt: Date.now(),
      deviceId: getDeviceId(),
    });

    // עדכון מוני שימוש: מי נוסף ומי הוסר.
    const now = Date.now();
    for (const id of after) {
      if (!before.has(id)) await bumpUseCount(id, 1, now);
    }
    for (const id of before) {
      if (!after.has(id)) await bumpUseCount(id, -1, now);
    }
  });
}

async function bumpUseCount(tagId: string, delta: number, now: number): Promise<void> {
  const tag = await db.tags.get(tagId);
  if (!tag) return;
  await db.tags.update(tagId, {
    useCount: Math.max(0, tag.useCount + delta),
    updatedAt: now,
  });
}

/** משנה שם תגית. */
export async function renameTag(tagId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.tags.update(tagId, { name: trimmed, updatedAt: Date.now(), deviceId: getDeviceId() });
}

/** משנה צבע תגית. */
export async function setTagColor(tagId: string, color: string): Promise<void> {
  await db.tags.update(tagId, { color, updatedAt: Date.now(), deviceId: getDeviceId() });
}

/**
 * ממזג את תגית המקור אל היעד: כל רסיס שתויג במקור יתויג ביעד, המקור נמחק רכות.
 */
export async function mergeTags(sourceId: string, targetId: string): Promise<void> {
  if (sourceId === targetId) return;
  await db.transaction('rw', db.fragments, db.tags, async () => {
    const frags = await db.fragments.toArray();
    const now = Date.now();
    for (const f of frags) {
      if (f.isDeleted || !f.tagIds.includes(sourceId)) continue;
      const set = new Set(f.tagIds);
      set.delete(sourceId);
      set.add(targetId);
      await db.fragments.update(f.id, {
        tagIds: [...set],
        updatedAt: now,
        deviceId: getDeviceId(),
      });
    }
    await db.tags.update(sourceId, { isDeleted: true, updatedAt: now, deviceId: getDeviceId() });
    await recomputeUseCounts();
  });
}

/** מחיקה רכה של תגית + הסרתה מכל הרסיסים. */
export async function deleteTag(tagId: string): Promise<void> {
  await db.transaction('rw', db.fragments, db.tags, async () => {
    const frags = await db.fragments.toArray();
    const now = Date.now();
    for (const f of frags) {
      if (!f.tagIds.includes(tagId)) continue;
      await db.fragments.update(f.id, {
        tagIds: f.tagIds.filter((id) => id !== tagId),
        updatedAt: now,
        deviceId: getDeviceId(),
      });
    }
    await db.tags.update(tagId, { isDeleted: true, updatedAt: now, deviceId: getDeviceId() });
  });
}

/**
 * מחשב מחדש את מוני השימוש מכל הרסיסים הפעילים. מקור אמת אמין אחרי מיזוגים,
 * ייבוא, או סנכרון.
 */
export async function recomputeUseCounts(): Promise<void> {
  const [frags, tags] = await Promise.all([db.fragments.toArray(), db.tags.toArray()]);
  const counts = new Map<string, number>();
  for (const f of frags) {
    if (f.isDeleted) continue;
    for (const id of f.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const now = Date.now();
  for (const t of tags) {
    const c = counts.get(t.id) ?? 0;
    if (t.useCount !== c) await db.tags.update(t.id, { useCount: c, updatedAt: now });
  }
}
