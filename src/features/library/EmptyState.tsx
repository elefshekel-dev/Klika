import { useNavigate } from 'react-router-dom';
import { createFragment } from '@/db/fragments';
import { IconPlus } from '@/components/icons';

/**
 * מסך ריק. אין onboarding של 4 מסכים — רק הזמנה אחת חמה להתחיל לכתוב.
 * לחיצה בכל מקום פותחת רסיס חדש עם הסמן בפנים.
 */
export default function EmptyState() {
  const navigate = useNavigate();

  const start = async () => {
    const f = await createFragment();
    navigate(`/f/${f.id}`);
  };

  return (
    <button
      onClick={start}
      className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-paper-50">
        <IconPlus size={28} />
      </span>
      <p className="font-reading text-xl text-ink-700">רסיס ראשון מחכה</p>
      <p className="max-w-xs text-sm leading-relaxed text-ink-400">
        שורה שעלתה בראש, בית, רעיון. כתבי אותו כאן — הוא יישמר מעצמו.
      </p>
    </button>
  );
}
