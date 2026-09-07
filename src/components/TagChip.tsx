import type { Tag } from '@/db/types';
import { IconX } from './icons';

interface Props {
  tag: Tag;
  onClick?: () => void;
  onRemove?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

/** תווית תגית צבעונית. מציגה נקודת צבע ושם; אופציונלית עם כפתור הסרה. */
export default function TagChip({ tag, onClick, onRemove, active, size = 'md' }: Props) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition ${pad} ${
        active
          ? 'border-transparent text-white'
          : 'border-paper-300 bg-white/70 text-ink-700 hover:border-ink-400'
      }`}
      style={active ? { backgroundColor: tag.color } : undefined}
    >
      {onClick ? (
        <button onClick={onClick} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: active ? 'rgba(255,255,255,0.9)' : tag.color }}
          />
          {tag.name}
        </button>
      ) : (
        <>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: active ? 'rgba(255,255,255,0.9)' : tag.color }}
          />
          {tag.name}
        </>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`הסרת התגית ${tag.name}`}
          className="-mr-0.5 flex items-center opacity-60 hover:opacity-100"
        >
          <IconX size={13} />
        </button>
      )}
    </span>
  );
}
