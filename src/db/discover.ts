// מציאה מחדש: רסיס אקראי ו"זיכרונות" (לפני שנה / החודש הזה בשנים קודמות).
// זה משנה את היחס לארכיון — דברים ישנים צפים מחדש.

import type { Fragment } from './types';
import { activeFragments } from './queries';

/** רסיס אקראי מכלל הרסיסים הפעילים. undefined אם אין. */
export async function randomFragment(): Promise<Fragment | undefined> {
  const all = await activeFragments();
  if (all.length === 0) return undefined;
  return all[Math.floor(Math.random() * all.length)];
}

/** רסיסים שנכתבו סביב "היום, לפני שנה" (חלון של ±windowDays). */
export async function aYearAgo(windowDays = 7): Promise<Fragment[]> {
  const all = await activeFragments();
  const target = new Date();
  target.setFullYear(target.getFullYear() - 1);
  const win = windowDays * 24 * 60 * 60 * 1000;
  const lo = target.getTime() - win;
  const hi = target.getTime() + win;
  return all
    .filter((f) => f.createdAt >= lo && f.createdAt <= hi)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** רסיסים שנכתבו בחודש הנוכחי, בשנים קודמות. */
export async function thisMonthPreviousYears(): Promise<Fragment[]> {
  const all = await activeFragments();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return all
    .filter((f) => {
      const d = new Date(f.createdAt);
      return d.getMonth() === month && d.getFullYear() < year;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
