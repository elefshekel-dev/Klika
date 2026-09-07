// מודל הנתונים של רסיסים.
//
// עקרונות שאסור להפוך:
// - לרסיס אין שדה חובה מלבד content. אין כותרת חובה, אין תגית חובה, אין סטטוס.
// - אין היררכיה. תגיות ואסופות הן שכבות שטוחות שמונחות מעל.
// - כל ישות נושאת updatedAt ו-deviceId כדי לאפשר סנכרון רב-מכשירי בעתיד.
//   אין להכניס הנחות single-user קשיחות למודל.

/** מזהה ייחודי (UUID). */
export type ID = string;

/** רסיס — יחידת הכתיבה הבסיסית. טקסט קצר ומקוטע. */
export interface Fragment {
  id: ID;
  /** התוכן. השדה החובה היחיד. שבירות שורה נשמרות בדיוק כפי שהוקלדו. */
  content: string;
  /** כותרת אופציונלית. אם ריקה — הספרייה מציגה את השורה הראשונה החתוכה. */
  title?: string;
  /** מזהי תגיות. שכבה שטוחה — רסיס יכול לחיות בלי אף תגית. */
  tagIds: ID[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  /** מחיקה רכה — נשמר לסנכרון (tombstone) עד ניקוי. */
  isDeleted: boolean;
  /** המכשיר שביצע את העדכון האחרון. לצורך התכנסות סנכרון. */
  deviceId: string;
}

/** תגית — נוצרת תוך כדי הקלדה. אין טקסונומיה מוגדרת מראש. */
export interface Tag {
  id: ID;
  name: string;
  /** צבע (מחלקת Tailwind / ערך hex). */
  color: string;
  createdAt: number;
  updatedAt: number;
  /** כמה רסיסים משתמשים בתגית — לצורך מיון השלמה אוטומטית. */
  useCount: number;
  isDeleted: boolean;
  deviceId: string;
}

/**
 * אסופה — רשימה מסודרת של רסיסים קיימים.
 * ריבוי חברות (CollectionMembership) ממומש דרך fragmentIds: אותו רסיס יכול
 * להופיע במספר אסופות בו-זמנית. מחיקת אסופה אינה מוחקת רסיסים.
 */
export interface Collection {
  id: ID;
  name: string;
  description: string;
  /** מזהי הרסיסים לפי סדר ידני. הסדר הוא נתון — לא נגזר. */
  fragmentIds: ID[];
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  deviceId: string;
}

/** גרסה — צילום מצב של תוכן רסיס. נשמרים 30 האחרונים לכל רסיס. */
export interface Version {
  id: ID;
  fragmentId: ID;
  content: string;
  savedAt: number;
  deviceId: string;
}

/** הגדרות משתמש — נשמרות מקומית, לא מסונכרנות. */
export interface Settings {
  id: 'singleton';
  /** גודל גופן העורך ב-px. */
  editorFontSize: number;
  /** רוחב שורה מקסימלי בעורך ב-ch. */
  editorLineWidth: number;
  /** גופן קריאה או sans. */
  editorFont: 'reading' | 'sans';
  /** האם להציג מונה מילים/שורות בעורך. */
  showCounter: boolean;
  /** מזהה המכשיר הנוכחי. */
  deviceId: string;
  /** חותמת הסנכרון האחרון המוצלח (ms). */
  lastSyncAt?: number;
}
