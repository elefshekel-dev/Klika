// שאילתות קריאה מרוכזות. מכיוון ש-isDeleted/isPinned אינם ניתנים לאינדוקס
// (בוליאני אינו מפתח חוקי ב-IndexedDB), הסינון נעשה כאן ב-JS. לכמות רסיסים
// בסדר גודל של מאות — סריקה מלאה זולה ומיידית.

import { db } from './db';
import type { Fragment } from './types';

/** כל הרסיסים הפעילים (לא מחוקים) ממוינים לפי עדכון אחרון (יורד). */
export async function activeFragments(): Promise<Fragment[]> {
  const all = await db.fragments.orderBy('updatedAt').reverse().toArray();
  return all.filter((f) => !f.isDeleted);
}

/** רסיסים פעילים לפי סדר יצירה (יורד) — יציב לניווט בעורך. */
export async function fragmentsByCreated(): Promise<Fragment[]> {
  const all = await db.fragments.orderBy('createdAt').reverse().toArray();
  return all.filter((f) => !f.isDeleted);
}
