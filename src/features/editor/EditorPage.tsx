import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { activeFragments } from '@/db/queries';
import {
  updateFragmentContent,
  deleteFragmentIfEmpty,
} from '@/db/fragments';
import { snapshotVersion } from '@/db/versions';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useSettings } from '@/hooks/useSettings';
import { useSwipe } from '@/hooks/useSwipe';
import EditorSurface from './EditorSurface';
import EditorTopBar from './EditorTopBar';
import VersionsSheet from './VersionsSheet';
import AudioPlayer from './AudioPlayer';
import TagEditor from '@/components/TagEditor';
import AddToCollectionSheet from '@/features/collections/AddToCollectionSheet';

/** מסך העורך. אחראי לשמירה אוטומטית, ניקוי רסיס ריק, וניווט בין רסיסים. */
export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = useSettings();

  const fragment = useLiveQuery(
    () => (id ? db.fragments.get(id) : undefined),
    [id],
  );

  const [collectionOpen, setCollectionOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  // תוכן שנכפה אחרי שחזור גרסה, קשור למזהה רסיס ספציפי כדי להימנע ממרוצי מצב.
  const [restored, setRestored] = useState<{ id: string; content: string; nonce: number } | null>(
    null,
  );

  // התוכן האחרון שהוקלד — לצילום גרסה בעת עזיבה, וללא תלות ב-fetch מהמסד.
  const latestContent = useRef<string>('');

  // סדר ניווט — צילום מצב חד-פעמי כדי שהשכנים לא יזוזו תוך כדי עריכה.
  const [order, setOrder] = useState<string[]>([]);
  const orderLoaded = useRef(false);
  useEffect(() => {
    if (orderLoaded.current) return;
    orderLoaded.current = true;
    void activeFragments().then((active) => setOrder(active.map((f) => f.id)));
  }, []);

  // מסנכרנים את התוכן האחרון עם הרסיס הנטען (בטעינה ובמעבר בין רסיסים).
  useEffect(() => {
    if (fragment) latestContent.current = fragment.content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragment?.id]);

  const save = useDebouncedCallback((content: string) => {
    if (!id) return;
    void updateFragmentContent(id, content);
    // צילום גרסה מווסת (לכל היותר אחד ל-90ש') תוך כדי עריכה.
    void snapshotVersion(id, content);
  }, 500);

  const handleChange = useCallback(
    (content: string) => {
      latestContent.current = content;
      save.call(content);
    },
    [save],
  );

  // שמירה, צילום גרסה סופי, וניקוי רסיס ריק בעת עזיבה/מעבר לרסיס אחר.
  const finalize = useCallback(
    (currentId: string | undefined) => {
      save.flush();
      if (!currentId) return;
      void snapshotVersion(currentId, latestContent.current, true);
      void deleteFragmentIfEmpty(currentId);
    },
    [save],
  );

  useEffect(() => {
    const currentId = id;
    return () => finalize(currentId);
  }, [id, finalize]);

  const goTo = useCallback(
    (targetId: string) => {
      finalize(id);
      navigate(`/f/${targetId}`, { replace: true });
    },
    [id, navigate, finalize],
  );

  const goBack = useCallback(() => {
    finalize(id);
    navigate('/');
  }, [id, navigate, finalize]);

  // ניווט לפי סדר התצוגה (מחושב גם כשהרסיס עדיין נטען — הוקים לפני return).
  const idx = fragment ? order.indexOf(fragment.id) : -1;
  const prevId = idx > 0 ? order[idx - 1] : undefined;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : undefined;

  // החלקה אופקית לניווט בין רסיסים: שמאלה=הבא, ימינה=הקודם.
  const swipe = useSwipe({
    onSwipeLeft: nextId ? () => goTo(nextId) : undefined,
    onSwipeRight: prevId ? () => goTo(prevId) : undefined,
  });

  if (!fragment) {
    // עדיין נטען, או שהרסיס לא קיים (למשל נמחק בשקט).
    return (
      <div className="flex h-full items-center justify-center text-ink-400">
        טוען…
      </div>
    );
  }

  // override תקף רק לרסיס שממנו שוחזר — כדי שניווט לרסיס אחר לא יציג תוכן ישן.
  const override = restored && restored.id === fragment.id ? restored : null;

  return (
    <div className="flex h-full flex-col bg-paper-50">
      <EditorTopBar
        onBack={goBack}
        onPrev={prevId ? () => goTo(prevId) : undefined}
        onNext={nextId ? () => goTo(nextId) : undefined}
        onAddToCollection={() => setCollectionOpen(true)}
        onHistory={() => setVersionsOpen(true)}
      />
      <div className="min-h-0 flex-1" {...swipe}>
        <EditorSurface
          key={`${fragment.id}:${override?.nonce ?? 0}`}
          fragment={fragment}
          settings={settings}
          onChange={handleChange}
          overrideContent={override?.content ?? null}
          autoFocus
        />
      </div>
      {/* נגן פתק קולי — מוצג רק אם יש הקלטה לרסיס. */}
      <div className="px-4">
        <AudioPlayer fragmentId={fragment.id} />
      </div>

      {/* שורת תיוג דיסקרטית בתחתית — תיוג אחרי הכתיבה, לא לפני. */}
      <div className="border-t border-paper-200 px-4 py-2">
        <TagEditor fragment={fragment} />
      </div>

      <AddToCollectionSheet
        fragmentId={collectionOpen ? fragment.id : null}
        onClose={() => setCollectionOpen(false)}
      />

      <VersionsSheet
        fragmentId={fragment.id}
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        onRestored={(content) => {
          latestContent.current = content;
          setRestored((r) => ({ id: fragment.id, content, nonce: (r?.nonce ?? 0) + 1 }));
          setVersionsOpen(false);
        }}
      />
    </div>
  );
}
