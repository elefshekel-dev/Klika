import { IconArrowRight, IconChevronUp, IconChevronDown, IconLayers } from '@/components/icons';

interface Props {
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onAddToCollection: () => void;
}

/**
 * סרגל עליון מינימלי לעורך. בנייד — דק ולא פולשני.
 * ניווט prev/next בין רסיסים לפי סדר התצוגה.
 */
export default function EditorTopBar({ onBack, onPrev, onNext, onAddToCollection }: Props) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <button
        onClick={onBack}
        aria-label="חזרה לספרייה"
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200 active:bg-paper-300"
      >
        <IconArrowRight />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={onAddToCollection}
          aria-label="הוספה לאסופה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200 active:bg-paper-300"
        >
          <IconLayers size={20} />
        </button>
        <button
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="רסיס קודם"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200 active:bg-paper-300 disabled:opacity-25"
        >
          <IconChevronUp />
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          aria-label="רסיס הבא"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200 active:bg-paper-300 disabled:opacity-25"
        >
          <IconChevronDown />
        </button>
      </div>
    </div>
  );
}
