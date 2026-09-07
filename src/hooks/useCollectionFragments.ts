import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Collection, Fragment } from '@/db/types';

/**
 * טוען את הרסיסים של אסופה בסדר שנקבע ידנית, ומסנן רסיסים שנמחקו.
 * מחזיר undefined בזמן טעינה.
 */
export function useCollectionFragments(collection: Collection | undefined): Fragment[] | undefined {
  return useLiveQuery(async () => {
    if (!collection) return undefined;
    const frags = await db.fragments.bulkGet(collection.fragmentIds);
    return collection.fragmentIds
      .map((_id, i) => frags[i])
      .filter((f): f is Fragment => !!f && !f.isDeleted);
  }, [collection?.id, collection?.fragmentIds.join(',')]);
}
