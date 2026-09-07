import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { activeFragments } from '@/db/queries';
import {
  updateFragmentContent,
  deleteFragmentIfEmpty,
} from '@/db/fragments';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useSettings } from '@/hooks/useSettings';
import EditorSurface from './EditorSurface';
import EditorTopBar from './EditorTopBar';

/** מסך העורך. אחראי לשמירה אוטומטית, ניקוי רסיס ריק, וניווט בין רסיסים. */
export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = useSettings();

  const fragment = useLiveQuery(
    () => (id ? db.fragments.get(id) : undefined),
    [id],
  );

  // סדר ניווט — צילום מצב חד-פעמי כדי שהשכנים לא יזוזו תוך כדי עריכה.
  const [order, setOrder] = useState<string[]>([]);
  const orderLoaded = useRef(false);
  useEffect(() => {
    if (orderLoaded.current) return;
    orderLoaded.current = true;
    void activeFragments().then((active) => setOrder(active.map((f) => f.id)));
  }, []);

  const save = useDebouncedCallback((content: string) => {
    if (id) void updateFragmentContent(id, content);
  }, 500);

  const handleChange = useCallback(
    (content: string) => save.call(content),
    [save],
  );

  // ניקוי רסיס ריק בעת עזיבת העורך.
  useEffect(() => {
    const currentId = id;
    return () => {
      save.flush();
      if (currentId) void deleteFragmentIfEmpty(currentId);
    };
  }, [id, save]);

  const goTo = useCallback(
    (targetId: string) => {
      save.flush();
      if (id) void deleteFragmentIfEmpty(id);
      navigate(`/f/${targetId}`, { replace: true });
    },
    [id, navigate, save],
  );

  const goBack = useCallback(() => {
    save.flush();
    if (id) void deleteFragmentIfEmpty(id);
    navigate('/');
  }, [id, navigate, save]);

  if (!fragment) {
    // עדיין נטען, או שהרסיס לא קיים (למשל נמחק בשקט).
    return (
      <div className="flex h-full items-center justify-center text-ink-400">
        טוען…
      </div>
    );
  }

  const idx = order.indexOf(fragment.id);
  const prevId = idx > 0 ? order[idx - 1] : undefined;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : undefined;

  return (
    <div className="flex h-full flex-col bg-paper-50">
      <EditorTopBar
        onBack={goBack}
        onPrev={prevId ? () => goTo(prevId) : undefined}
        onNext={nextId ? () => goTo(nextId) : undefined}
      />
      <div className="min-h-0 flex-1">
        <EditorSurface
          key={fragment.id}
          fragment={fragment}
          settings={settings}
          onChange={handleChange}
          autoFocus
        />
      </div>
    </div>
  );
}
