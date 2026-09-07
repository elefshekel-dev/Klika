import Sheet from '@/components/Sheet';
import type { Fragment } from '@/db/types';
import { togglePin, softDeleteFragment } from '@/db/fragments';
import { displayTitle } from '@/lib/textStats';
import { IconPin, IconX } from '@/components/icons';

interface Props {
  fragment: Fragment | null;
  onClose: () => void;
  /** פעולות נוספות שמזריקים שלבים מאוחרים (למשל הוספה לאסופה). */
  extraActions?: (fragment: Fragment) => React.ReactNode;
}

/** גיליון פעולות לרסיס בודד מתוך הספרייה. */
export default function FragmentActionSheet({ fragment, onClose, extraActions }: Props) {
  if (!fragment) return null;

  const remove = async () => {
    await softDeleteFragment(fragment.id);
    onClose();
  };

  const rowClass =
    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-right text-[15px] text-ink-800 hover:bg-paper-100';

  return (
    <Sheet open={!!fragment} onClose={onClose} title={displayTitle(fragment.title, fragment.content)}>
      <div className="flex flex-col">
        <button onClick={() => void togglePin(fragment.id).then(onClose)} className={rowClass}>
          <IconPin size={18} className="text-ink-400" />
          {fragment.isPinned ? 'ביטול נעיצה' : 'נעיצה'}
        </button>
        {extraActions?.(fragment)}
        <button onClick={() => void remove()} className={`${rowClass} text-rose-700`}>
          <IconX size={18} className="text-rose-400" />
          מחיקה
        </button>
      </div>
    </Sheet>
  );
}
