import { useTags } from '@/hooks/useTags';
import TagChip from '@/components/TagChip';
import type { LibraryFilter } from './filter';

interface Props {
  filter: LibraryFilter;
  onChange: (f: LibraryFilter) => void;
}

// ממיר timestamp ל-YYYY-MM-DD עבור input[type=date].
function toDateInput(ms?: number): string {
  if (ms === undefined) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** פאנל סינון משולב: מספר תגיות (AND/OR) וטווח תאריכים. */
export default function FilterPanel({ filter, onChange }: Props) {
  const tags = useTags();

  const toggleTag = (id: string) => {
    const has = filter.tagIds.includes(id);
    onChange({
      ...filter,
      tagIds: has ? filter.tagIds.filter((t) => t !== id) : [...filter.tagIds, id],
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-paper-200 bg-white/50 p-3" dir="rtl">
      {tags.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-500">סינון לפי תגיות</span>
            {filter.tagIds.length > 1 && (
              <div className="flex overflow-hidden rounded-full border border-paper-300 text-xs">
                {(['and', 'or'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChange({ ...filter, tagMode: mode })}
                    className={`px-2.5 py-0.5 ${
                      filter.tagMode === mode ? 'bg-ink-900 text-paper-50' : 'text-ink-500'
                    }`}
                  >
                    {mode === 'and' ? 'כל התגיות' : 'לפחות אחת'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip
                key={t.id}
                tag={t}
                active={filter.tagIds.includes(t.id)}
                onClick={() => toggleTag(t.id)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-500">טווח תאריכים</span>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={toDateInput(filter.from)}
            onChange={(e) =>
              onChange({
                ...filter,
                from: e.target.value ? new Date(e.target.value).setHours(0, 0, 0, 0) : undefined,
              })
            }
            className="rounded-lg border border-paper-200 bg-white px-2 py-1 text-ink-700"
          />
          <span className="text-ink-400">—</span>
          <input
            type="date"
            value={toDateInput(filter.to)}
            onChange={(e) =>
              onChange({
                ...filter,
                to: e.target.value ? new Date(e.target.value).setHours(23, 59, 59, 999) : undefined,
              })
            }
            className="rounded-lg border border-paper-200 bg-white px-2 py-1 text-ink-700"
          />
        </div>
      </div>
    </div>
  );
}
