// הגדרות משתמש — נשמרות מקומית ב-Dexie. לא מסונכרנות (מקומיות למכשיר).
//
// ⚠️ אסור לבצע כתיבה בתוך useLiveQuery (טרנזקציית קריאה-בלבד). לכן קריאת
// ההגדרות היא read-only, ויצירת ברירת המחדל נעשית פעם אחת ב-ensureSettings
// בעליית האפליקציה — מחוץ ל-liveQuery.

import { db } from './db';
import type { Settings } from './types';
import { getDeviceId } from '@/lib/device';

const DEFAULTS: Omit<Settings, 'deviceId'> = {
  id: 'singleton',
  editorFontSize: 19,
  editorLineWidth: 42,
  editorFont: 'reading',
  showCounter: true,
};

/** ברירות מחדל מלאות (כולל deviceId) — לשימוש בזיכרון עד שהשורה נכתבת. */
export function defaultSettings(): Settings {
  return { ...DEFAULTS, deviceId: getDeviceId() };
}

/** קריאה בלבד — מחזיר את השורה אם קיימת. בטוח לשימוש בתוך liveQuery. */
export async function readSettings(): Promise<Settings | undefined> {
  return db.settings.get('singleton');
}

/** יוצר את שורת ההגדרות אם עוד אין. נקרא פעם אחת בעליית האפליקציה. */
export async function ensureSettings(): Promise<void> {
  const existing = await db.settings.get('singleton');
  if (!existing) await db.settings.put(defaultSettings());
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = (await db.settings.get('singleton')) ?? defaultSettings();
  await db.settings.put({ ...current, ...patch, id: 'singleton' });
}
