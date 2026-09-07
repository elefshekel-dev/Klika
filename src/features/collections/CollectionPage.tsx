import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCollection } from '@/hooks/useCollections';
import { useCollectionFragments } from '@/hooks/useCollectionFragments';
import {
  renameCollection,
  deleteCollection,
  removeFragmentFromCollection,
  reorderCollection,
} from '@/db/collections';
import { collectionToText, downloadText, copyText, safeFileName } from '@/lib/export';
import { detectDir } from '@/lib/direction';
import Sheet from '@/components/Sheet';
import {
  IconArrowRight,
  IconGrip,
  IconX,
  IconDots,
  IconDownload,
  IconLayers,
} from '@/components/icons';

/** תצוגת אסופה: סדר ידני עם גרירה, הסרה, קריאה רצופה וייצוא. */
export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collection = useCollection(id);
  const fragments = useCollectionFragments(collection);

  const [menuOpen, setMenuOpen] = useState(false);
  const [nameEdit, setNameEdit] = useState(false);
  const [nameValue, setNameValue] = useState('');

  // סדר מקומי לגרירה — מסונכרן מהאסופה כשלא גוררים.
  const [order, setOrder] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    if (!dragging && fragments) setOrder(fragments.map((f) => f.id));
  }, [fragments, dragging]);

  if (collection === undefined) return null;
  if (!collection || collection.isDeleted) {
    navigate('/collections', { replace: true });
    return null;
  }

  const byId = new Map((fragments ?? []).map((f) => [f.id, f]));

  // --- גרירה לשינוי סדר (pointer events — עובד גם במגע) ---
  const onPointerDown = (key: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(key);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const y = e.clientY;
    // מוצאים מעל איזו שורה נמצא המצביע לפי אמצע כל שורה.
    let targetKey: string | null = null;
    for (const key of order) {
      const el = rowRefs.current.get(key);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        targetKey = key;
        break;
      }
    }
    if (!targetKey || targetKey === dragging) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragging);
      const to = prev.indexOf(targetKey!);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(null);
    void reorderCollection(collection.id, order);
  };

  const doExport = () => {
    const text = collectionToText(collection, fragments ?? []);
    downloadText(`${safeFileName(collection.name)}.md`, text, 'text/markdown');
    setMenuOpen(false);
  };

  const doCopy = async () => {
    await copyText(collectionToText(collection, fragments ?? []));
    setMenuOpen(false);
  };

  const commitName = async () => {
    if (nameValue.trim()) await renameCollection(collection.id, nameValue);
    setNameEdit(false);
  };

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <header className="flex items-center gap-1 border-b border-paper-200 bg-paper-50/90 px-2 py-2">
        <button
          onClick={() => navigate('/collections')}
          aria-label="חזרה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconArrowRight />
        </button>
        {nameEdit ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => void commitName()}
            onKeyDown={(e) => e.key === 'Enter' && void commitName()}
            className="flex-1 rounded border border-paper-300 bg-white px-2 py-1 font-reading text-xl outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setNameValue(collection.name);
              setNameEdit(true);
            }}
            className="flex-1 truncate text-right font-reading text-xl text-ink-900"
          >
            {collection.name}
          </button>
        )}
        <button
          onClick={() => navigate(`/collections/${collection.id}/read`)}
          aria-label="קריאה רצופה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconLayers size={20} />
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="פעולות אסופה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconDots />
        </button>
      </header>

      <div className="scroll-y min-h-0 flex-1 px-4 py-3">
        {fragments && fragments.length === 0 ? (
          <p className="mt-12 text-center text-sm text-ink-400">
            האסופה ריקה. הוסיפי רסיסים מהספרייה או מתוך העורך (בתפריט הרסיס).
          </p>
        ) : (
          <ul className="space-y-2" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {order.map((key) => {
              const f = byId.get(key);
              if (!f) return null;
              const dir = detectDir(f.content);
              return (
                <li
                  key={key}
                  ref={(el) => {
                    if (el) rowRefs.current.set(key, el);
                    else rowRefs.current.delete(key);
                  }}
                  className={`flex items-stretch gap-2 rounded-xl border bg-white/60 transition ${
                    dragging === key ? 'border-ink-400 shadow-md' : 'border-paper-200'
                  }`}
                >
                  <button
                    onPointerDown={onPointerDown(key)}
                    aria-label="גרירה לשינוי סדר"
                    className="flex w-9 shrink-0 cursor-grab items-center justify-center text-ink-300 active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                  >
                    <IconGrip size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/f/${f.id}`)}
                    className="min-w-0 flex-1 py-3 text-right"
                    dir={dir}
                  >
                    <p
                      className="whitespace-pre-wrap break-words font-reading text-[15px] leading-relaxed text-ink-800"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {f.content.trim() || 'רסיס ריק'}
                    </p>
                  </button>
                  <button
                    onClick={() => void removeFragmentFromCollection(collection.id, f.id)}
                    aria-label="הסרה מהאסופה"
                    className="flex w-10 shrink-0 items-center justify-center text-ink-300 hover:text-rose-600"
                  >
                    <IconX size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={collection.name}>
        <div className="flex flex-col">
          <button
            onClick={doExport}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100"
          >
            <IconDownload size={18} className="text-ink-400" />
            ייצוא כקובץ
          </button>
          <button
            onClick={() => void doCopy()}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100"
          >
            <IconLayers size={18} className="text-ink-400" />
            העתקת האסופה כטקסט
          </button>
          <button
            onClick={() => void deleteCollection(collection.id).then(() => navigate('/collections'))}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-right text-[15px] text-rose-700 hover:bg-paper-100"
          >
            <IconX size={18} className="text-rose-400" />
            מחיקת האסופה (הרסיסים יישארו)
          </button>
        </div>
      </Sheet>
    </div>
  );
}
