import { useNavigate } from 'react-router-dom';
import { createFragment } from '@/db/fragments';
import { IconPlus } from './icons';

/**
 * כפתור הלכידה. נוכח תמיד, בכל מסך, בהישג אגודל.
 * לחיצה = רסיס חדש פתוח עם הסמן בטקסט. בלי דיאלוג, בלי בחירת סוג.
 */
export default function Fab() {
  const navigate = useNavigate();

  const capture = async () => {
    const f = await createFragment();
    navigate(`/f/${f.id}`);
  };

  return (
    <button
      onClick={capture}
      aria-label="רסיס חדש"
      className="fixed bottom-6 left-1/2 z-30 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-ink-900 text-paper-50 shadow-lg shadow-ink-900/25 transition active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
    >
      <IconPlus size={28} />
    </button>
  );
}
