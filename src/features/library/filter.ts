// מודל הסינון של הספרייה והלוגיקה שמפעילה אותו. הכל בזיכרון — לכמות רסיסים
// בסדר גודל של מאות, סינון מלא הוא מיידי.

import type { Fragment } from '@/db/types';
import { hebrewMatch } from '@/lib/hebrew';

export type LibraryView =
  | { kind: 'all' }
  | { kind: 'untagged' }
  | { kind: 'pinned' }
  | { kind: 'tag'; tagId: string };

export interface LibraryFilter {
  view: LibraryView;
  /** חיפוש טקסט מלא (as-you-type). */
  search: string;
  /** סינון משולב לפי מספר תגיות. */
  tagIds: string[];
  tagMode: 'and' | 'or';
  /** טווח תאריכי יצירה (ms). */
  from?: number;
  to?: number;
}

export const emptyFilter: LibraryFilter = {
  view: { kind: 'all' },
  search: '',
  tagIds: [],
  tagMode: 'and',
};

/** מסנן ומסדר את הרסיסים לפי מצב הסינון. הקלט חייב להיות רסיסים פעילים. */
export function applyFilter(fragments: Fragment[], filter: LibraryFilter): Fragment[] {
  const { view, search, tagIds, tagMode, from, to } = filter;

  const out = fragments.filter((f) => {
    // תצוגה בסיסית.
    if (view.kind === 'untagged' && f.tagIds.length > 0) return false;
    if (view.kind === 'pinned' && !f.isPinned) return false;
    if (view.kind === 'tag' && !f.tagIds.includes(view.tagId)) return false;

    // סינון משולב לפי תגיות.
    if (tagIds.length > 0) {
      const has =
        tagMode === 'and'
          ? tagIds.every((id) => f.tagIds.includes(id))
          : tagIds.some((id) => f.tagIds.includes(id));
      if (!has) return false;
    }

    // טווח תאריכים לפי מועד היצירה.
    if (from !== undefined && f.createdAt < from) return false;
    if (to !== undefined && f.createdAt > to) return false;

    // חיפוש טקסט מלא עם נרמול עברי.
    if (search.trim() && !hebrewMatch(f.content, search)) return false;

    return true;
  });

  // נעוצים תמיד בראש (למעט בתצוגת אסופה שיש לה סדר ידני — לא כאן).
  out.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
  return out;
}

/** האם הסינון פעיל מעבר לתצוגה הבסיסית (לצורך תצוגת "נקה"). */
export function hasActiveFilter(filter: LibraryFilter): boolean {
  return (
    filter.search.trim() !== '' ||
    filter.tagIds.length > 0 ||
    filter.from !== undefined ||
    filter.to !== undefined
  );
}
