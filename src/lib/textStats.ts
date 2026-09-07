// מונה מילים ושורות. שורות נספרות בדיוק כפי שהוקלדו (כולל ריקות).

export interface TextStats {
  words: number;
  lines: number;
  chars: number;
}

export function textStats(text: string): TextStats {
  const chars = text.length;
  // שורות: לפי תווי מעבר שורה. טקסט ריק = שורה אחת (ריקה).
  const lines = text.length === 0 ? 0 : text.split('\n').length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  return { words, lines, chars };
}

/** גוזר את השורה הראשונה הלא-ריקה לתצוגת כותרת נגזרת. */
export function firstLine(text: string, max = 80): string {
  const line = text.split('\n').find((l) => l.trim() !== '') ?? '';
  const trimmed = line.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
}

/** כותרת לתצוגה: הכותרת המפורשת אם קיימת, אחרת השורה הראשונה. */
export function displayTitle(title: string | undefined, content: string): string {
  if (title && title.trim()) return title.trim();
  const fl = firstLine(content);
  return fl || 'רסיס ריק';
}
