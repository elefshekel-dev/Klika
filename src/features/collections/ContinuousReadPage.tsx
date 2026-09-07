import { useNavigate, useParams } from 'react-router-dom';
import { useCollection } from '@/hooks/useCollections';
import { useCollectionFragments } from '@/hooks/useCollectionFragments';
import { useSettings } from '@/hooks/useSettings';
import { detectDir } from '@/lib/direction';
import { IconArrowRight } from '@/components/icons';

/**
 * קריאה רצופה — כל רסיסי האסופה בזה אחר זה, נקי, בלי UI. ככה בודקים אם קובץ
 * שירים עובד. כפתור חזרה דיסקרטי בלבד.
 */
export default function ContinuousReadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collection = useCollection(id);
  const fragments = useCollectionFragments(collection);
  const settings = useSettings();

  if (!collection || !fragments) return null;

  const fontFamily =
    settings.editorFont === 'reading'
      ? '"Frank Ruhl Libre", Georgia, serif'
      : '"Assistant", system-ui, sans-serif';

  return (
    <div className="scroll-y h-full bg-paper-50">
      <button
        onClick={() => navigate(`/collections/${collection.id}`)}
        aria-label="חזרה"
        className="fixed left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-ink-500 backdrop-blur hover:bg-white"
      >
        <IconArrowRight />
      </button>

      <article
        className="mx-auto max-w-2xl px-6 py-16"
        style={{ fontFamily, fontSize: `${settings.editorFontSize}px`, lineHeight: 1.8 }}
      >
        {fragments.map((f, i) => (
          <div key={f.id} dir={detectDir(f.content)}>
            {i > 0 && <div className="my-10 text-center text-ink-300">· · ·</div>}
            <p className="whitespace-pre-wrap break-words text-ink-900">{f.content}</p>
          </div>
        ))}
      </article>
    </div>
  );
}
