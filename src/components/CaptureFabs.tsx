import { useNavigate } from 'react-router-dom';
import { createFragment } from '@/db/fragments';
import { IconPlus, IconMic } from './icons';

interface Props {
  /** נפתח כשמקישים על המיקרופון. */
  onVoice: () => void;
}

/**
 * אשכול הלכידה בתחתית המסך, בהישג אגודל: מיקרופון (פתק קולי) ו-"+" (טקסט).
 * שניהם פותחים לכידה מיידית בלי דיאלוג.
 */
export default function CaptureFabs({ onVoice }: Props) {
  const navigate = useNavigate();

  const captureText = async () => {
    const f = await createFragment();
    navigate(`/f/${f.id}`);
  };

  return (
    <div
      className="fixed bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 pb-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
    >
      <button
        onClick={onVoice}
        aria-label="פתק קולי"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-paper-300 bg-white text-ink-700 shadow-md transition active:scale-95"
      >
        <IconMic size={24} />
      </button>
      <button
        onClick={captureText}
        aria-label="רסיס חדש"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-paper-50 shadow-lg shadow-ink-900/25 transition active:scale-95"
      >
        <IconPlus size={28} />
      </button>
    </div>
  );
}
