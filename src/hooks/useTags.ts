import { useLiveQuery } from 'dexie-react-hooks';
import { listTags } from '@/db/tags';
import type { Tag } from '@/db/types';

/** כל התגיות הפעילות, ממוינות לפי שכיחות. ריאקטיבי. */
export function useTags(): Tag[] {
  return useLiveQuery(() => listTags(), []) ?? [];
}

/** מפה ממזהה תגית לאובייקט התגית — לחיפוש מהיר בתצוגות. */
export function useTagMap(): Map<string, Tag> {
  const tags = useTags();
  return new Map(tags.map((t) => [t.id, t]));
}
