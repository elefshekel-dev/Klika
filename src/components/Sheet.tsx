import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * גיליון תחתון (bottom sheet) — תבנית פעולות ראשית בנייד. נפתח מלמטה,
 * בהישג אגודל, עם רקע כהה שסוגר בלחיצה.
 */
export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-2xl bg-paper-50 p-4 shadow-2xl sm:rounded-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        dir="rtl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-paper-300 sm:hidden" />
        {title && <h2 className="mb-2 px-1 text-sm font-semibold text-ink-700">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
