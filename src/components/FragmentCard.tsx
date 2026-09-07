import type { Fragment } from '@/db/types';
import { detectDir } from '@/lib/direction';
import { IconPin } from './icons';

interface Props {
  fragment: Fragment;
  onClick: () => void;
  /** תוכן נוסף בתחתית הכרטיס (למשל שורת תיוג מהיר). */
  footer?: React.ReactNode;
}

/**
 * כרטיס רסיס בספרייה. הטקסט עצמו הוא הזיהוי — 3-4 שורות ראשונות,
 * לא שם קובץ. הכיוון נקבע לפי תוכן הרסיס.
 */
export default function FragmentCard({ fragment, onClick, footer }: Props) {
  const dir = detectDir(fragment.content);
  const preview = fragment.content.trim() || 'רסיס ריק';

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-paper-200 bg-white/60 transition hover:border-paper-300 hover:shadow-sm">
      <button
        onClick={onClick}
        className="flex-1 px-4 pb-3 pt-4 text-right"
        dir={dir}
      >
        {fragment.isPinned && (
          <span className="mb-1 inline-flex text-ink-400">
            <IconPin size={14} />
          </span>
        )}
        <p
          className="line-clamp-4 whitespace-pre-wrap break-words font-reading text-[15px] leading-relaxed text-ink-800"
          style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}
        >
          {preview}
        </p>
      </button>
      {footer && <div className="px-3 pb-2.5">{footer}</div>}
    </div>
  );
}
