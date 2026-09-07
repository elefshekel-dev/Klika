import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Sheet from '@/components/Sheet';
import { IconPlus, IconCheck } from '@/components/icons';
import { useCollections } from '@/hooks/useCollections';
import {
  addFragmentToCollection,
  removeFragmentFromCollection,
  createCollection,
  collectionsForFragment,
} from '@/db/collections';

interface Props {
  fragmentId: string | null;
  onClose: () => void;
}

/** בחירת האסופות שרסיס שייך אליהן. אפשר להוסיף להרבה אסופות ולהסיר מהן. */
export default function AddToCollectionSheet({ fragmentId, onClose }: Props) {
  const collections = useCollections();
  const [newName, setNewName] = useState('');
  const membership = useLiveQuery(
    () => (fragmentId ? collectionsForFragment(fragmentId) : new Set<string>()),
    [fragmentId],
  );

  if (!fragmentId) return null;

  const toggle = async (collectionId: string) => {
    if (membership?.has(collectionId)) {
      await removeFragmentFromCollection(collectionId, fragmentId);
    } else {
      await addFragmentToCollection(collectionId, fragmentId);
    }
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const c = await createCollection(name);
    await addFragmentToCollection(c.id, fragmentId);
    setNewName('');
  };

  return (
    <Sheet open={!!fragmentId} onClose={onClose} title="הוספה לאסופה">
      <div className="flex max-h-[50vh] flex-col overflow-y-auto">
        {collections.map((c) => {
          const inside = membership?.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => void toggle(c.id)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  inside ? 'border-ink-800 bg-ink-800 text-paper-50' : 'border-paper-300'
                }`}
              >
                {inside && <IconCheck size={14} />}
              </span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-ink-400">{c.fragmentIds.length}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-paper-200 pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void createAndAdd()}
          placeholder="אסופה חדשה…"
          className="flex-1 rounded-lg border border-paper-200 bg-white px-3 py-2 text-[15px] outline-none"
          dir="rtl"
        />
        <button
          onClick={() => void createAndAdd()}
          disabled={!newName.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-paper-50 disabled:opacity-30"
          aria-label="יצירת אסופה והוספה"
        >
          <IconPlus size={20} />
        </button>
      </div>
    </Sheet>
  );
}
