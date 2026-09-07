// יצירת קובצי ה-Markdown הקריאים לאדם ב-Drive: קובץ .md לכל רסיס וקובץ מאוחד
// לכל אסופה. אלה גיבוי קריא — מקור האמת למיזוג הוא fragments-data.json.

import type { Fragment, Collection } from '@/db/types';
import { safeFileName } from '@/lib/export';
import { collectionToText } from '@/lib/export';

// YYYY-MM-DD מתוך timestamp.
function dateStamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** שם קובץ ה-md של רסיס: YYYY-MM-DD-<שורה-ראשונה>.md */
export function fragmentFileName(f: Fragment): string {
  return `${dateStamp(f.createdAt)}-${safeFileName(f.content, 40)}.md`;
}

/** תוכן ה-md של רסיס — כותרת (אם יש) ואז התוכן, בלי שינוי שבירות שורה. */
export function fragmentMarkdown(f: Fragment): string {
  const title = f.title?.trim() ? `# ${f.title.trim()}\n\n` : '';
  return title + f.content + '\n';
}

/** שם קובץ ה-md של אסופה. */
export function collectionFileName(c: Collection): string {
  return `${safeFileName(c.name, 50)}.md`;
}

/** תוכן ה-md המאוחד של אסופה. */
export function collectionMarkdown(c: Collection, fragments: Fragment[]): string {
  return collectionToText(c, fragments) + '\n';
}
