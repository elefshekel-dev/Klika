import { useLiveQuery } from 'dexie-react-hooks';
import { listCollections, getCollection } from '@/db/collections';
import type { Collection } from '@/db/types';

/** כל האסופות הפעילות. ריאקטיבי. */
export function useCollections(): Collection[] {
  return useLiveQuery(() => listCollections(), []) ?? [];
}

/** אסופה בודדת לפי מזהה. undefined בזמן טעינה או אם לא קיימת. */
export function useCollection(id: string | undefined): Collection | undefined {
  return useLiveQuery(() => (id ? getCollection(id) : undefined), [id]);
}
