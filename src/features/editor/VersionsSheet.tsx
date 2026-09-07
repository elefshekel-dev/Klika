import { useLiveQuery } from 'dexie-react-hooks';
import Sheet from '@/components/Sheet';
import { listVersions, restoreVersion } from '@/db/versions';
import { detectDir } from '@/lib/direction';

interface Props {
  fragmentId: string;
  open: boolean;
  onClose: () => void;
  /** נקרא אחרי שחזור מוצלח, עם התוכן ששוחזר — כדי לרענן את העורך. */
  onRestored: (content: string) => void;
}

/** היסטוריית גרסאות של רסיס — תצוגה מקדימה ושחזור. */
export default function VersionsSheet({ fragmentId, open, onClose, onRestored }: Props) {
  const versions = useLiveQuery(
    () => (open ? listVersions(fragmentId) : []),
    [fragmentId, open],
  );

  return (
    <Sheet open={open} onClose={onClose} title="גרסאות קודמות">
      {!versions || versions.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-ink-400">
          עדיין אין גרסאות שמורות. הן נשמרות מעצמן תוך כדי כתיבה.
        </p>
      ) : (
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => void restoreVersion(fragmentId, v.id).then(() => onRestored(v.content))}
              className="rounded-lg border border-paper-200 bg-white/60 p-3 text-right hover:border-ink-400"
              dir={detectDir(v.content)}
            >
              <div className="mb-1 text-xs text-ink-400">
                {new Date(v.savedAt).toLocaleString('he-IL')}
              </div>
              <p
                className="whitespace-pre-wrap break-words font-reading text-[14px] leading-relaxed text-ink-700"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {v.content}
              </p>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
