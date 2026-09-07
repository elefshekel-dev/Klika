import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { activeFragments } from '@/db/queries';
import { useTags } from '@/hooks/useTags';
import type { Fragment } from '@/db/types';
import FragmentCard from '@/components/FragmentCard';
import TagEditor from '@/components/TagEditor';
import TagChip from '@/components/TagChip';
import { IconSettings } from '@/components/icons';
import EmptyState from './EmptyState';
import SearchBar from './SearchBar';
import ViewTabs from './ViewTabs';
import FilterPanel from './FilterPanel';
import FragmentActionSheet from './FragmentActionSheet';
import ContextualHint from './ContextualHint';
import { emptyFilter, hasActiveFilter, type LibraryFilter, type LibraryView } from './filter';
import { useLibrary, useUntaggedCount } from './useLibrary';

/** הספרייה — הלב של המוצר. תצוגות, חיפוש, סינון ותיוג מהיר. */
export default function LibraryPage() {
  const navigate = useNavigate();
  const tags = useTags();
  const totalCount = useLiveQuery(() => activeFragments().then((f) => f.length), []) ?? 0;
  const untaggedCount = useUntaggedCount();

  const [filter, setFilter] = useState<LibraryFilter>(emptyFilter);
  const [showFilter, setShowFilter] = useState(false);
  const [actionFragment, setActionFragment] = useState<Fragment | null>(null);

  const fragments = useLibrary(filter);

  const setView = (view: LibraryView) =>
    setFilter((f) => ({ ...f, view, tagIds: [], from: undefined, to: undefined }));

  if (totalCount === 0 && !hasActiveFilter(filter)) {
    return <EmptyState />;
  }

  const currentTagId = filter.view.kind === 'tag' ? filter.view.tagId : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* כותרת + חיפוש + תצוגות — נשארות למעלה. */}
      <header className="shrink-0 space-y-3 border-b border-paper-200 bg-paper-50/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="font-reading text-2xl text-ink-900">רסיסים</h1>
          <button
            onClick={() => navigate('/settings')}
            aria-label="הגדרות"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
          >
            <IconSettings size={20} />
          </button>
        </div>

        <SearchBar value={filter.search} onChange={(search) => setFilter((f) => ({ ...f, search }))} />

        <div className="flex items-center gap-2">
          <ViewTabs
            view={filter.view}
            onChange={setView}
            untaggedCount={untaggedCount}
          />
          {tags.length > 0 && (
            <button
              onClick={() => setShowFilter((s) => !s)}
              className={`mr-auto rounded-full px-3 py-1.5 text-sm transition ${
                showFilter || filter.tagIds.length || filter.from || filter.to
                  ? 'bg-ink-800 text-paper-50'
                  : 'bg-white/70 text-ink-600 hover:bg-paper-200'
              }`}
            >
              סינון
            </button>
          )}
        </div>

        {/* שורת תגיות — מעבר מהיר לתצוגת תגית. */}
        {tags.length > 0 && !showFilter && (
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {tags.map((t) => (
              <span key={t.id} className="shrink-0">
                <TagChip
                  tag={t}
                  active={currentTagId === t.id}
                  size="sm"
                  onClick={() =>
                    setView(
                      currentTagId === t.id ? { kind: 'all' } : { kind: 'tag', tagId: t.id },
                    )
                  }
                />
              </span>
            ))}
          </div>
        )}

        {showFilter && <FilterPanel filter={filter} onChange={setFilter} />}
      </header>

      {/* רשת הרסיסים. */}
      <div className="scroll-y min-h-0 flex-1 px-4 pb-28 pt-3">
        {totalCount >= 5 && tags.length === 0 && (
          <div className="mb-3">
            <ContextualHint id="tags-intro">
              כבר נצברו לך כמה רסיסים. אפשר להוסיף <b>תגיות</b> כדי למצוא אותם מחדש
              בקלות — פשוט הקלידי תגית בתחתית כל רסיס, או כאן בתצוגת "לא מתויג".
            </ContextualHint>
          </div>
        )}

        {fragments === undefined ? null : fragments.length === 0 ? (
          <p className="mt-16 text-center text-sm text-ink-400">אין רסיסים שתואמים.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fragments.map((f) => (
              <FragmentCard
                key={f.id}
                fragment={f}
                onClick={() => navigate(`/f/${f.id}`)}
                onMenu={() => setActionFragment(f)}
                footer={
                  filter.view.kind === 'untagged' ? (
                    // תיוג מהיר ישירות מכאן, בלי להיכנס לרסיס.
                    <TagEditor fragment={f} compact />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <FragmentActionSheet fragment={actionFragment} onClose={() => setActionFragment(null)} />
    </div>
  );
}
