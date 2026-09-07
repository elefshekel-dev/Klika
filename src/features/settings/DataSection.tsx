import { buildSnapshot } from '@/sync/snapshot';
import { downloadText } from '@/lib/export';
import { IconDownload } from '@/components/icons';

/**
 * ייצוא כל הנתונים כ-JSON מלא — נקודת בריחה מהמערכת. תמיד אפשר לקחת את הכל
 * ולצאת. אין ייבוא (המשתמשת מתחילה מאפס), אבל היציאה חופשית.
 */
export default function DataSection() {
  const exportAll = async () => {
    const snapshot = await buildSnapshot();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`resisim-backup-${stamp}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink-700">הנתונים שלך</h2>
      <div className="space-y-3 rounded-xl border border-paper-200 bg-white/50 p-3">
        <p className="text-sm leading-relaxed text-ink-600">
          כל הרסיסים, התגיות, האסופות והגרסאות — בקובץ JSON אחד. שמרי אותו איפה
          שתרצי; הנתונים שלך, תמיד ביד.
        </p>
        <button
          onClick={() => void exportAll()}
          className="flex items-center gap-2 rounded-lg border border-paper-300 px-4 py-2 text-sm text-ink-700 hover:bg-paper-100"
        >
          <IconDownload size={18} className="text-ink-400" />
          ייצוא כל הנתונים (JSON)
        </button>
      </div>
    </section>
  );
}
