import type { LibraryView } from './filter';

interface Props {
  view: LibraryView;
  onChange: (v: LibraryView) => void;
  untaggedCount: number;
}

/**
 * מתגי התצוגות הראשיות: הכל / לא מתויג / נעוצים.
 * "לא מתויג" הוא תצוגה מרכזית — ערימת הרסיסים שעוד לא סודרו.
 */
export default function ViewTabs({ view, onChange, untaggedCount }: Props) {
  const tabs: { key: LibraryView['kind']; label: string; badge?: number }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'untagged', label: 'לא מתויג', badge: untaggedCount },
    { key: 'pinned', label: 'נעוצים' },
  ];

  return (
    <div className="flex gap-1.5">
      {tabs.map((t) => {
        const active = view.kind === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange({ kind: t.key } as LibraryView)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
              active
                ? 'bg-ink-900 text-paper-50'
                : 'bg-white/70 text-ink-600 hover:bg-paper-200'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? 'bg-white/25' : 'bg-paper-200 text-ink-500'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
