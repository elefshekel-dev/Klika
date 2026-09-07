// ייצוא והעתקה של תוכן כטקסט מעוצב. זו "נקודת בריחה" מהמערכת ודרך השיתוף
// היחידה — אין קישורים ציבוריים, רק ייצוא/העתקה של טקסט.

import type { Fragment, Collection } from '@/db/types';
import { firstLine } from './textStats';

/** רסיס בודד כטקסט. שבירות שורה נשמרות כפי שהן. */
export function fragmentToText(f: Fragment): string {
  const header = f.title?.trim() ? `${f.title.trim()}\n\n` : '';
  return header + f.content;
}

/** אסופה שלמה כקובץ טקסט אחד — הרסיסים בזה אחר זה לפי הסדר, מופרדים בקו. */
export function collectionToText(collection: Collection, fragments: Fragment[]): string {
  const byId = new Map(fragments.map((f) => [f.id, f]));
  const parts: string[] = [];
  if (collection.name.trim()) parts.push(collection.name.trim());
  if (collection.description.trim()) parts.push(collection.description.trim());
  const body = collection.fragmentIds
    .map((id) => byId.get(id))
    .filter((f): f is Fragment => !!f && !f.isDeleted)
    .map((f) => fragmentToText(f))
    .join('\n\n· · ·\n\n');
  parts.push(body);
  return parts.join('\n\n');
}

/** שם קובץ בטוח מתוך טקסט חופשי (לשימוש בייצוא ל-Drive וקבצים). */
export function safeFileName(text: string, max = 50): string {
  const base = firstLine(text, max).replace(/[\\/:*?"<>|]/g, '').trim();
  return base || 'רסיס';
}

/** מוריד תוכן טקסטואלי כקובץ. */
export function downloadText(filename: string, content: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** מעתיק טקסט ללוח. מחזיר האם הצליח. */
export async function copyText(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
