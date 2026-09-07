// מיזוג תלת-כיווני בין מצב מקומי, מרוחק, ובסיס הסנכרון האחרון.
//
// עקרון קדוש: קונפליקט לפי updatedAt — לעולם לא לדרוס. אם שני הצדדים שינו את
// אותה ישות מאז הסנכרון האחרון, שומרים את החדש יותר ויוצרים עותק מהשני (לרסיסים)
// כדי שדבר לא יאבד. המיזוג דטרמיניסטי ולכן מתכנס נכון בין מספר מכשירים.

import type { Fragment, Tag, Collection, Version } from '@/db/types';
import type { Snapshot, BaseMap, MergeResult } from './types';
import { newId } from '@/lib/id';

interface Entity {
  id: string;
  updatedAt: number;
  deviceId: string;
}

/** בוחר את הזוכה בין שתי גרסאות: updatedAt גדול, ובתיקו — deviceId גבוה. */
function pickNewer<T extends Entity>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return a.deviceId >= b.deviceId ? a : b;
}

/**
 * ממזג רשימת ישויות מטיפוס אחד. מחזיר את הרשומות הממוזגות ואת רשימת ה"מפסידים"
 * בקונפליקט אמיתי (שני הצדדים שינו מאז הבסיס ותוכנם שונה).
 */
function mergeEntities<T extends Entity>(
  local: T[],
  remote: T[],
  base: BaseMap,
  equal: (a: T, b: T) => boolean,
): { merged: T[]; losers: T[] } {
  const localMap = new Map(local.map((e) => [e.id, e]));
  const remoteMap = new Map(remote.map((e) => [e.id, e]));
  const ids = new Set([...localMap.keys(), ...remoteMap.keys()]);

  const merged: T[] = [];
  const losers: T[] = [];

  for (const id of ids) {
    const l = localMap.get(id);
    const r = remoteMap.get(id);

    if (l && !r) {
      merged.push(l);
      continue;
    }
    if (r && !l) {
      merged.push(r);
      continue;
    }
    if (!l || !r) continue;

    const b = base[id] ?? 0;
    const lChanged = l.updatedAt > b;
    const rChanged = r.updatedAt > b;

    if (lChanged && rChanged && !equal(l, r)) {
      // קונפליקט אמיתי — הזוכה נשמר, המפסיד נשמר כעותק.
      const winner = pickNewer(l, r);
      const loser = winner === l ? r : l;
      merged.push(winner);
      losers.push(loser);
    } else {
      merged.push(pickNewer(l, r));
    }
  }

  return { merged, losers };
}

const fragmentsEqual = (a: Fragment, b: Fragment) =>
  a.content === b.content &&
  (a.title ?? '') === (b.title ?? '') &&
  a.isPinned === b.isPinned &&
  a.isDeleted === b.isDeleted &&
  a.tagIds.slice().sort().join(',') === b.tagIds.slice().sort().join(',');

const tagsEqual = (a: Tag, b: Tag) =>
  a.name === b.name && a.color === b.color && a.isDeleted === b.isDeleted;

const collectionsEqual = (a: Collection, b: Collection) =>
  a.name === b.name &&
  a.description === b.description &&
  a.isDeleted === b.isDeleted &&
  a.fragmentIds.join(',') === b.fragmentIds.join(',');

/** יוצר עותק קונפליקט מרסיס מפסיד — סימון ברור בתחילת התוכן. */
function conflictCopy(loser: Fragment, now: number, deviceId: string): Fragment {
  return {
    ...loser,
    id: newId(),
    content: `⚠️ עותק מסנכרון (גרסה מתנגשת)\n\n${loser.content}`,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    isDeleted: false,
    deviceId,
  };
}

/** מאחד גרסאות (immutable) לפי מזהה, וגוזם ל-30 האחרונות לכל רסיס. */
function mergeVersions(local: Version[], remote: Version[]): Version[] {
  const byId = new Map<string, Version>();
  for (const v of [...local, ...remote]) byId.set(v.id, v);
  const all = [...byId.values()];

  const byFragment = new Map<string, Version[]>();
  for (const v of all) {
    const arr = byFragment.get(v.fragmentId) ?? [];
    arr.push(v);
    byFragment.set(v.fragmentId, arr);
  }
  const out: Version[] = [];
  for (const arr of byFragment.values()) {
    arr.sort((a, b) => b.savedAt - a.savedAt);
    out.push(...arr.slice(0, 30));
  }
  return out;
}

/** בונה את מפת הבסיס החדשה מהישויות הממוזגות. */
function buildBase(...groups: Entity[][]): BaseMap {
  const base: BaseMap = {};
  for (const group of groups) for (const e of group) base[e.id] = e.updatedAt;
  return base;
}

/** המיזוג הראשי. */
export function mergeSnapshots(
  local: Snapshot,
  remote: Snapshot,
  base: BaseMap,
  deviceId: string,
  now: number = Date.now(),
): MergeResult {
  const frag = mergeEntities(local.fragments, remote.fragments, base, fragmentsEqual);
  const tag = mergeEntities(local.tags, remote.tags, base, tagsEqual);
  const col = mergeEntities(local.collections, remote.collections, base, collectionsEqual);

  const conflicts = frag.losers.map((l) => conflictCopy(l, now, deviceId));
  const fragments = [...frag.merged, ...conflicts];
  const versions = mergeVersions(local.versions, remote.versions);

  return {
    fragments,
    tags: tag.merged,
    collections: col.merged,
    versions,
    conflicts,
    base: buildBase(fragments, tag.merged, col.merged),
  };
}
