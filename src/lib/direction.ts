// זיהוי כיוון טקסט אוטומטי לפי תוכן.
// עברית ⇐ RTL, אנגלית ⇒ LTR. ההחלטה לפי התו ה"חזק" הראשון בטקסט.

const RTL_CHAR = /[֐-׿؀-ۿ܀-ݏ]/;
const LTR_CHAR = /[A-Za-zÀ-ɏ]/;

export type Dir = 'rtl' | 'ltr';

/** כיוון ברירת מחדל לפי התו החזק הראשון. ברירת מחדל RTL (עברית). */
export function detectDir(text: string): Dir {
  for (const ch of text) {
    if (RTL_CHAR.test(ch)) return 'rtl';
    if (LTR_CHAR.test(ch)) return 'ltr';
  }
  return 'rtl';
}
