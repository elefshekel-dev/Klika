import { useRef } from 'react';

interface Handlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * זיהוי החלקה אופקית. מחזיר handlers ל-onTouchStart/onTouchEnd.
 * מתעלם ממחוות אנכיות (גלילה) ומהחלקות קצרות — כדי לא להתנגש בבחירת טקסט.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight }: Handlers) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      const dt = Date.now() - start.current.t;
      start.current = null;
      // מחווה מהירה, אופקית ברורה, עם מרחק מספק.
      if (dt > 600) return;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
  };
}
