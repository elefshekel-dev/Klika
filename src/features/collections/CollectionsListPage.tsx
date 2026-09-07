import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollections';
import { createCollection } from '@/db/collections';
import { IconArrowRight, IconPlus, IconLayers } from '@/components/icons';

/** רשימת האסופות. יצירת אסופה חדשה כאן; מילוי הרסיסים נעשה מתוך הספרייה/העורך. */
export default function CollectionsListPage() {
  const navigate = useNavigate();
  const collections = useCollections();
  const [newName, setNewName] = useState('');

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const c = await createCollection(name);
    setNewName('');
    navigate(`/collections/${c.id}`);
  };

  return (
    <div className="scroll-y h-full pb-28" dir="rtl">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-paper-200 bg-paper-50/90 px-2 py-2 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          aria-label="חזרה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconArrowRight />
        </button>
        <h1 className="font-reading text-xl text-ink-900">אסופות</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void create()}
            placeholder="אסופה חדשה…"
            className="flex-1 rounded-xl border border-paper-200 bg-white px-3 py-2.5 text-[15px] outline-none"
          />
          <button
            onClick={() => void create()}
            disabled={!newName.trim()}
            aria-label="יצירת אסופה"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-paper-50 disabled:opacity-30"
          >
            <IconPlus size={22} />
          </button>
        </div>

        {collections.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-400">
            אסופה היא רשימה מסודרת של רסיסים — ככה בודקים אם קובץ שירים עובד.
            צרי אחת והוסיפי אליה רסיסים מהספרייה.
          </p>
        ) : (
          <ul className="space-y-2">
            {collections.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/collections/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-paper-200 bg-white/60 px-4 py-3 text-right hover:border-paper-300"
                >
                  <IconLayers size={20} className="shrink-0 text-ink-400" />
                  <span className="flex-1">
                    <span className="block text-[15px] text-ink-800">{c.name}</span>
                    {c.description && (
                      <span className="block truncate text-xs text-ink-400">{c.description}</span>
                    )}
                  </span>
                  <span className="text-xs text-ink-400">{c.fragmentIds.length} רסיסים</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
