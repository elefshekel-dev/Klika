import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { activeFragments } from '@/db/queries';
import FragmentCard from '@/components/FragmentCard';
import EmptyState from './EmptyState';

/**
 * הספרייה — הלב של המוצר. גרסת שלב 1: רשימת "הכל" לפי עדכון אחרון.
 * (תצוגות, חיפוש ותיוג מהיר נבנים בשלב 2.)
 */
export default function LibraryPage() {
  const navigate = useNavigate();
  const fragments = useLiveQuery(() => activeFragments(), []);

  if (fragments === undefined) return null;

  if (fragments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="scroll-y h-full px-4 pb-28 pt-4">
      <h1 className="mb-4 px-1 font-sans text-lg font-semibold text-ink-800">
        הכל
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fragments.map((f) => (
          <FragmentCard
            key={f.id}
            fragment={f}
            onClick={() => navigate(`/f/${f.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
