import { useSync } from '@/hooks/useSync';
import { sync } from '@/sync/driveSync';
import { isConnected } from '@/sync/googleAuth';
import { IconCloud } from './icons';

/**
 * אינדיקטור סנכרון קומפקטי לכותרת. מופיע רק כשמחוברים ל-Drive.
 * לחיצה מפעילה סנכרון ידני. הצבע משקף את המצב.
 */
export default function SyncIndicator() {
  const state = useSync();
  if (!isConnected()) return null;

  const tone =
    state.status === 'error'
      ? 'text-rose-500'
      : state.status === 'conflict'
        ? 'text-amber-600'
        : state.status === 'syncing'
          ? 'text-ink-400 animate-pulse'
          : 'text-ink-400';

  return (
    <button
      onClick={() => void sync.syncNow(false)}
      aria-label="סנכרון"
      title={state.status === 'syncing' ? 'מסנכרן…' : 'סנכרון עכשיו'}
      className={`flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper-200 ${tone}`}
    >
      <IconCloud size={20} />
    </button>
  );
}
