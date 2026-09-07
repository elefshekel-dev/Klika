import { useMemo, useRef, useState } from 'react';
import type { Fragment } from '@/db/types';
import { useTags } from '@/hooks/useTags';
import { getOrCreateTag, setFragmentTags } from '@/db/tags';
import { normalizeHebrew } from '@/lib/hebrew';
import TagChip from './TagChip';
import { IconTag, IconPlus } from './icons';

interface Props {
  fragment: Fragment;
  /** גרסה קומפקטית לשורת תיוג מהיר בספרייה. */
  compact?: boolean;
}

/**
 * עריכת תגיות של רסיס. תיוג קורה אחרי הכתיבה: שדה דיסקרטי עם השלמה אוטומטית
 * לפי תגיות קיימות (ממוינות לפי שכיחות), ויצירת תגית חדשה תוך כדי הקלדה.
 */
export default function TagEditor({ fragment, compact }: Props) {
  const allTags = useTags();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applied = allTags.filter((t) => fragment.tagIds.includes(t.id));

  const suggestions = useMemo(() => {
    const q = normalizeHebrew(input);
    const notApplied = allTags.filter((t) => !fragment.tagIds.includes(t.id));
    if (!q) return notApplied.slice(0, 8);
    return notApplied.filter((t) => normalizeHebrew(t.name).includes(q)).slice(0, 8);
  }, [input, allTags, fragment.tagIds]);

  // האם ההקלדה תיצור תגית חדשה (אין התאמה מדויקת בשם).
  const trimmed = input.trim();
  const exactExists = allTags.some((t) => normalizeHebrew(t.name) === normalizeHebrew(trimmed));
  const canCreate = trimmed.length > 0 && !exactExists;

  const addByName = async (name: string) => {
    const tag = await getOrCreateTag(name);
    if (!fragment.tagIds.includes(tag.id)) {
      await setFragmentTags(fragment.id, [...fragment.tagIds, tag.id]);
    }
    setInput('');
    inputRef.current?.focus();
  };

  const removeTag = async (tagId: string) => {
    await setFragmentTags(
      fragment.id,
      fragment.tagIds.filter((id) => id !== tagId),
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && trimmed) {
      e.preventDefault();
      void addByName(trimmed);
    } else if (e.key === 'Backspace' && !input && applied.length) {
      void removeTag(applied[applied.length - 1].id);
    }
  };

  return (
    <div className="relative" dir="rtl">
      <div className="flex flex-wrap items-center gap-1.5">
        {!compact && <IconTag size={16} className="text-ink-400" />}
        {applied.map((t) => (
          <TagChip key={t.id} tag={t} active onRemove={() => void removeTag(t.id)} size="sm" />
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          placeholder={applied.length ? 'עוד תגית…' : 'הוספת תגית…'}
          className="min-w-[7rem] flex-1 bg-transparent py-1 text-[13px] text-ink-700 outline-none placeholder:text-ink-400"
        />
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <div className="absolute bottom-full z-20 mb-1 max-h-56 w-full min-w-[12rem] overflow-y-auto rounded-lg border border-paper-200 bg-white p-1 shadow-lg">
          {canCreate && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void addByName(trimmed)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-[13px] text-ink-700 hover:bg-paper-100"
            >
              <IconPlus size={14} className="text-ink-400" />
              יצירת תגית "{trimmed}"
            </button>
          )}
          {suggestions.map((t) => (
            <button
              key={t.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void addByName(t.name)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-[13px] text-ink-700 hover:bg-paper-100"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
              <span className="mr-auto text-xs text-ink-400">{t.useCount}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
