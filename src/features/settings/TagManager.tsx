import { useState } from 'react';
import { useTags } from '@/hooks/useTags';
import { renameTag, setTagColor, deleteTag, mergeTags, TAG_COLORS } from '@/db/tags';
import Sheet from '@/components/Sheet';
import { IconDots } from '@/components/icons';
import type { Tag } from '@/db/types';

/** ניהול תגיות: שינוי שם, צבע, מיזוג, ומחיקה. */
export default function TagManager() {
  const tags = useTags();
  const [menuTag, setMenuTag] = useState<Tag | null>(null);
  const [renaming, setRenaming] = useState<Tag | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [merging, setMerging] = useState<Tag | null>(null);

  if (tags.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-700">תגיות</h2>
        <p className="text-sm text-ink-400">
          עדיין אין תגיות. הן נוצרות תוך כדי כתיבה — הקלידי תגית בתחתית רסיס.
        </p>
      </section>
    );
  }

  const startRename = (t: Tag) => {
    setRenaming(t);
    setRenameValue(t.name);
    setMenuTag(null);
  };

  const commitRename = async () => {
    if (renaming) await renameTag(renaming.id, renameValue);
    setRenaming(null);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink-700">תגיות</h2>
      <ul className="divide-y divide-paper-200 overflow-hidden rounded-xl border border-paper-200 bg-white/50">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
            {/* בורר צבע — לחיצה על צבע מחליפה. */}
            <ColorDot tag={t} />
            {renaming?.id === t.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => void commitRename()}
                onKeyDown={(e) => e.key === 'Enter' && void commitRename()}
                className="flex-1 rounded border border-paper-300 bg-white px-2 py-1 text-sm outline-none"
              />
            ) : (
              <button onClick={() => startRename(t)} className="flex-1 text-right text-[15px] text-ink-800">
                {t.name}
              </button>
            )}
            <span className="text-xs text-ink-400">{t.useCount}</span>
            <button
              onClick={() => setMenuTag(t)}
              aria-label="פעולות תגית"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 hover:bg-paper-100"
            >
              <IconDots size={18} />
            </button>
          </li>
        ))}
      </ul>

      {/* גיליון פעולות לתגית. */}
      <Sheet open={!!menuTag} onClose={() => setMenuTag(null)} title={menuTag?.name}>
        {menuTag && (
          <div className="flex flex-col">
            <div className="px-3 py-2">
              <p className="mb-2 text-xs text-ink-500">צבע</p>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => void setTagColor(menuTag.id, c).then(() => setMenuTag(null))}
                    aria-label={`צבע ${c}`}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${
                      menuTag.color === c ? 'ring-ink-700' : 'ring-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setMerging(menuTag);
                setMenuTag(null);
              }}
              className="rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100"
            >
              מיזוג לתוך תגית אחרת…
            </button>
            <button
              onClick={() => void deleteTag(menuTag.id).then(() => setMenuTag(null))}
              className="rounded-lg px-3 py-3 text-right text-[15px] text-rose-700 hover:bg-paper-100"
            >
              מחיקת התגית
            </button>
          </div>
        )}
      </Sheet>

      {/* בחירת יעד מיזוג. */}
      <Sheet open={!!merging} onClose={() => setMerging(null)} title={`מיזוג "${merging?.name}" לתוך…`}>
        {merging && (
          <div className="flex flex-col">
            {tags
              .filter((t) => t.id !== merging.id)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => void mergeTags(merging.id, t.id).then(() => setMerging(null))}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
              ))}
          </div>
        )}
      </Sheet>
    </section>
  );
}

// נקודת צבע לחיצה שמחליפה בין צבעי הפלטה במעגל.
function ColorDot({ tag }: { tag: Tag }) {
  const next = () => {
    const i = TAG_COLORS.indexOf(tag.color as (typeof TAG_COLORS)[number]);
    const nextColor = TAG_COLORS[(i + 1) % TAG_COLORS.length];
    void setTagColor(tag.id, nextColor);
  };
  return (
    <button
      onClick={next}
      aria-label="החלפת צבע"
      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
      style={{ backgroundColor: tag.color }}
    />
  );
}
