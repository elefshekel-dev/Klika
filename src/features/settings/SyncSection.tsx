import { useSync } from '@/hooks/useSync';
import { sync } from '@/sync/driveSync';
import { connect, disconnect, isConnected } from '@/sync/googleAuth';
import { IconCloud, IconCheck, IconClock } from '@/components/icons';

/** מציג את מצב הסנכרון בקצרה. */
function statusLine(state: ReturnType<typeof useSync>): { text: string; tone: string } {
  switch (state.status) {
    case 'unconfigured':
      return { text: 'לא מוגדר (ראי README)', tone: 'text-ink-400' };
    case 'disabled':
      return { text: 'לא מחובר', tone: 'text-ink-400' };
    case 'syncing':
      return { text: 'מסנכרן…', tone: 'text-ink-500' };
    case 'error':
      return { text: 'שגיאה: ' + state.message, tone: 'text-rose-600' };
    case 'conflict':
      return {
        text: `סונכרן — נוצרו ${state.count} עותקי קונפליקט (חפשי "עותק מסנכרון")`,
        tone: 'text-amber-700',
      };
    case 'idle':
      return {
        text: state.lastSyncAt
          ? 'סונכרן לאחרונה ' + new Date(state.lastSyncAt).toLocaleString('he-IL')
          : 'מחובר',
        tone: 'text-ink-500',
      };
  }
}

/** אזור הגדרות הגיבוי ל-Google Drive. */
export default function SyncSection() {
  const state = useSync();
  const configured = state.status !== 'unconfigured';
  const connected = configured && isConnected();
  const { text, tone } = statusLine(state);

  const handleConnect = async () => {
    try {
      await connect();
      sync.startAuto();
    } catch {
      // מצב השגיאה מנוהל דרך syncNow; חיבור שנכשל פשוט לא מסמן מחובר.
      await sync.syncNow(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    sync.stopAuto();
    window.location.reload();
  };

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <IconCloud size={18} className="text-ink-400" />
        גיבוי ל-Google Drive
      </h2>

      {!configured ? (
        <p className="rounded-xl border border-paper-200 bg-white/50 p-3 text-sm leading-relaxed text-ink-500">
          גיבוי לענן לא הוגדר. האפליקציה עובדת במלואה בלעדיו — הכל נשמר במכשיר.
          כדי להפעיל גיבוי, צרי מזהה OAuth של Google לפי ההוראות ב-README והגדירי
          את <code className="rounded bg-paper-100 px-1">VITE_GOOGLE_CLIENT_ID</code>.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border border-paper-200 bg-white/50 p-3">
          <p className="text-sm leading-relaxed text-ink-600">
            הגיבוי נשמר בתיקייה גלויה בשם "רסיסים" ב-Drive שלך — כך תמיד יש לך גישה
            לגיבויים גם בלי האפליקציה. הסנכרון opt-in ומתעדכן אוטומטית כל 5 דקות.
          </p>

          <div className={`flex items-center gap-2 text-sm ${tone}`}>
            {state.status === 'idle' && <IconCheck size={16} />}
            {state.status === 'syncing' && <IconClock size={16} />}
            <span>{text}</span>
          </div>

          <div className="flex gap-2">
            {!connected ? (
              <button
                onClick={() => void handleConnect()}
                className="rounded-lg bg-ink-900 px-4 py-2 text-sm text-paper-50"
              >
                חיבור ל-Google Drive
              </button>
            ) : (
              <>
                <button
                  onClick={() => void sync.syncNow(true)}
                  disabled={state.status === 'syncing'}
                  className="rounded-lg bg-ink-900 px-4 py-2 text-sm text-paper-50 disabled:opacity-40"
                >
                  סנכרון עכשיו
                </button>
                <button
                  onClick={handleDisconnect}
                  className="rounded-lg border border-paper-300 px-4 py-2 text-sm text-ink-600"
                >
                  ניתוק
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
