import { useLiveQuery } from 'dexie-react-hooks';
import { readSettings, defaultSettings } from '@/db/settings';
import type { Settings } from '@/db/types';

/**
 * קורא את ההגדרות בצורה ריאקטיבית. אם השורה עוד לא נכתבה — מחזיר ברירות
 * מחדל בזיכרון, כך שהעורך עובד מיד. הכתיבה בפועל נעשית ב-ensureSettings.
 */
export function useSettings(): Settings {
  const row = useLiveQuery(() => readSettings(), []);
  return row ?? defaultSettings();
}
