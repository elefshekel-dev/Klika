import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * מחזיר גרסה משוהה (debounced) של פונקציה. משמש לשמירה אוטומטית —
 * שומרים 500ms אחרי הפסקת ההקלדה, לא בכל תו.
 * flush() שומר מיד את הקריאה הממתינה (למשל לפני יציאה מהעורך).
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): { call: (...args: A) => void; flush: () => void; cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<A | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const call = useCallback(
    (...args: A) => {
      pending.current = args;
      clear();
      timer.current = setTimeout(() => {
        timer.current = null;
        if (pending.current) {
          fnRef.current(...pending.current);
          pending.current = null;
        }
      }, delay);
    },
    [delay],
  );

  const flush = useCallback(() => {
    clear();
    if (pending.current) {
      fnRef.current(...pending.current);
      pending.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clear();
    pending.current = null;
  }, []);

  // שמירת הקריאה הממתינה כשהרכיב יורד מהמסך.
  useEffect(() => () => flush(), [flush]);

  // אובייקט יציב — כדי שלא יגרום ל-effects תלויים לרוץ מחדש בכל render.
  return useMemo(() => ({ call, flush, cancel }), [call, flush, cancel]);
}
