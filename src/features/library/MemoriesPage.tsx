import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { aYearAgo, thisMonthPreviousYears } from '@/db/discover';
import FragmentCard from '@/components/FragmentCard';
import { IconArrowRight } from '@/components/icons';
import type { Fragment } from '@/db/types';

function Section({ title, fragments }: { title: string; fragments: Fragment[] }) {
  const navigate = useNavigate();
  if (fragments.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink-700">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fragments.map((f) => (
          <FragmentCard key={f.id} fragment={f} onClick={() => navigate(`/f/${f.id}`)} />
        ))}
      </div>
    </section>
  );
}

/** זיכרונות — רסיסים מלפני שנה ומהחודש הזה בשנים קודמות. */
export default function MemoriesPage() {
  const navigate = useNavigate();
  const yearAgo = useLiveQuery(() => aYearAgo(), []);
  const prevYears = useLiveQuery(() => thisMonthPreviousYears(), []);

  const empty = yearAgo?.length === 0 && prevYears?.length === 0;

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
        <h1 className="font-reading text-xl text-ink-900">זיכרונות</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-5">
        {empty ? (
          <p className="mt-12 text-center text-sm text-ink-400">
            עוד אין זיכרונות להציג. הם יופיעו כאן כשיצטבר לך ארכיון של רסיסים
            לאורך זמן.
          </p>
        ) : (
          <>
            <Section title="לפני שנה" fragments={yearAgo ?? []} />
            <Section title="החודש הזה, בשנים קודמות" fragments={prevYears ?? []} />
          </>
        )}
      </div>
    </div>
  );
}
