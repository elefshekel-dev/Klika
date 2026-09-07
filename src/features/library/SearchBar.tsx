import { IconSearch, IconX } from '@/components/icons';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** שורת חיפוש טקסט מלא — מסננת מיד תוך כדי הקלדה. */
export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-paper-200 bg-white/70 px-3 py-2">
      <IconSearch size={18} className="shrink-0 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש בכל הרסיסים…"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-800 outline-none placeholder:text-ink-400"
        dir="rtl"
        inputMode="search"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="ניקוי חיפוש"
          className="shrink-0 text-ink-400 hover:text-ink-700"
        >
          <IconX size={16} />
        </button>
      )}
    </div>
  );
}
