import { useState } from 'react';
import { IconX } from '@/components/icons';

interface Props {
  id: string;
  children: React.ReactNode;
}

/**
 * רמז בהקשר — מופיע כשצריך (למשל אחרי שנצברו כמה רסיסים), ניתן לסגירה,
 * ולא חוזר. לא onboarding — הסבר קטן במקום ובזמן הנכון.
 */
export default function ContextualHint({ id, children }: Props) {
  const key = `resisim.hint.${id}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const close = () => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* מתעלמים */
    }
    setDismissed(true);
  };

  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink-700"
      dir="rtl"
    >
      <p className="flex-1">{children}</p>
      <button onClick={close} aria-label="סגירה" className="shrink-0 text-ink-400 hover:text-ink-700">
        <IconX size={15} />
      </button>
    </div>
  );
}
