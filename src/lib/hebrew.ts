// נרמול עברי לחיפוש.
//
// המטרה: שחיפוש "מלכים" ימצא גם "מְלָכִים" (עם ניקוד), ש-"נגן" ימצא "נגן"
// שנכתב עם ן' סופית באמצע, ושחיפוש חלקי בתוך מילה יעבוד.

// טווח סימני הניקוד והטעמים בעברית (Unicode combining marks).
const NIKKUD = /[֑-ׇ]/g;

// מיפוי אותיות סופיות לצורתן הרגילה — כדי שחיפוש יתעלם מהצורה.
const FINAL_LETTERS: Record<string, string> = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

/**
 * מנרמל טקסט לחיפוש: מסיר ניקוד, ממפה אותיות סופיות, מאחד רווחים,
 * מסיר גרשיים/מקפים, וממיר לאותיות קטנות (לאנגלית מעורבת).
 */
export function normalizeHebrew(text: string): string {
  if (!text) return '';
  let out = text.normalize('NFC').replace(NIKKUD, '');
  out = out.replace(/[ךםןףץ]/g, (c) => FINAL_LETTERS[c] ?? c);
  // גרש, גרשיים, מקף, גרשיים טיפוגרפיים — לא רלוונטיים לחיפוש.
  out = out.replace(/["'`׳״‘’“”-]/g, '');
  out = out.replace(/\s+/g, ' ').trim().toLowerCase();
  return out;
}

/** האם השאילתה מופיעה בטקסט (אחרי נרמול שני הצדדים). חיפוש חלקי. */
export function hebrewMatch(text: string, query: string): boolean {
  const q = normalizeHebrew(query);
  if (!q) return true;
  return normalizeHebrew(text).includes(q);
}
