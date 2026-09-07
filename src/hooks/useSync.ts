import { useEffect, useState } from 'react';
import { sync } from '@/sync/driveSync';
import type { SyncState } from '@/sync/types';

/** עוקב אחרי מצב הסנכרון בצורה ריאקטיבית. */
export function useSync(): SyncState {
  const [state, setState] = useState<SyncState>(() => sync.getState());
  useEffect(() => sync.subscribe(setState), []);
  return state;
}
