import { useEffect } from 'react';

/**
 * מטפל בגובה חלון התצוגה בנייד. כשהמקלדת נפתחת, visualViewport מתכווץ —
 * מעדכנים משתנה CSS ‎--app-vh‎ כדי שהעורך ושורת התיוג לא ייחתכו מאחורי המקלדת.
 * דפדפנים שתומכים ב-dvh מקבלים ערך מדויק; לשאר יש נפילה ל-innerHeight.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-vh', `${h}px`);
    };
    apply();
    if (vv) {
      vv.addEventListener('resize', apply);
      vv.addEventListener('scroll', apply);
    }
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', apply);
        vv.removeEventListener('scroll', apply);
      }
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
