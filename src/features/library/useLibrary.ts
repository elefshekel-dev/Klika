import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { activeFragments } from '@/db/queries';
import { applyFilter, type LibraryFilter } from './filter';
import type { Fragment } from '@/db/types';

/** מחזיר את הרסיסים המסוננים לפי מצב הסינון. ריאקטיבי לשינויים במסד. */
export function useLibrary(filter: LibraryFilter): Fragment[] | undefined {
  const all = useLiveQuery(() => activeFragments(), []);
  return useMemo(() => (all ? applyFilter(all, filter) : undefined), [all, filter]);
}

/** ספירת הרסיסים הלא-מתויגים — לתגית המונה על תצוגת "לא מתויג". */
export function useUntaggedCount(): number {
  const all = useLiveQuery(() => activeFragments(), []);
  return all ? all.filter((f) => f.tagIds.length === 0).length : 0;
}
