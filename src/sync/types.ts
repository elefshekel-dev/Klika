// טיפוסים לשכבת הסנכרון. הסנכרון הוא שכבה opt-in מעל האחסון המקומי — האפליקציה
// עובדת במלואה בלעדיו. מקור האמת למיזוג הוא fragments-data.json ב-Drive.

import type { Fragment, Tag, Collection, Version } from '@/db/types';

/** תמונת מצב מלאה של הנתונים — הפורמט של fragments-data.json. */
export interface Snapshot {
  version: number;
  exportedAt: number;
  deviceId: string;
  fragments: Fragment[];
  tags: Tag[];
  collections: Collection[];
  versions: Version[];
}

/**
 * מפה ממזהה ישות ל-updatedAt שלה בסנכרון האחרון (בסיס המיזוג התלת-כיווני).
 * מזהי UUID ייחודיים בין כל הישויות, לכן מפה אחת מספיקה.
 */
export type BaseMap = Record<string, number>;

/** תוצאת מיזוג בין מצב מקומי, מרוחק, ובסיס. */
export interface MergeResult {
  fragments: Fragment[];
  tags: Tag[];
  collections: Collection[];
  versions: Version[];
  /** עותקי קונפליקט שיש להוסיף מקומית ומרוחק (לעולם לא דורסים). */
  conflicts: Fragment[];
  /** בסיס חדש לסנכרון הבא. */
  base: BaseMap;
}

/** מצב חיבור/סנכרון לתצוגה. */
export type SyncState =
  | { status: 'disabled' } // המשתמשת לא חיברה
  | { status: 'unconfigured' } // אין VITE_GOOGLE_CLIENT_ID
  | { status: 'idle'; lastSyncAt?: number }
  | { status: 'syncing' }
  | { status: 'error'; message: string }
  | { status: 'conflict'; count: number; lastSyncAt?: number };
