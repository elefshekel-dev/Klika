// עטיפה דקה מעל Web Speech API לתמלול חי בעברית. ללא backend — הדפדפן עצמו
// מבצע את התמלול. זמין בעיקר ב-Chrome (מחשב ואנדרואיד); דורש רשת.

/* eslint-disable @typescript-eslint/no-explicit-any */

/** האם הדפדפן תומך בזיהוי דיבור. */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export interface SpeechSession {
  stop: () => void;
  abort: () => void;
}

interface Handlers {
  /** תמלול מצטבר סופי + החלק הזמני הנוכחי. */
  onTranscript: (finalText: string, interim: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

/**
 * מתחיל תמלול חי בעברית. מחזיר בקרת עצירה, או null אם לא נתמך.
 * מצטבר את התוצאות הסופיות ומעביר גם את החלק הזמני (interim) לתצוגה חיה.
 */
export function startSpeech(handlers: Handlers): SpeechSession | null {
  const Ctor: any =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = 'he-IL';
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = '';
  let stopped = false;

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    handlers.onTranscript(finalText, interim);
  };

  recognition.onerror = (event: any) => {
    // 'no-speech'/'aborted' הן שגיאות שגרתיות ולא מעניינות את המשתמשת.
    if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') {
      handlers.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    // Chrome עוצר לפעמים מעצמו; אם לא ביקשנו לעצור — מפעילים מחדש כדי להמשיך.
    if (!stopped) {
      try {
        recognition.start();
        return;
      } catch {
        /* מתעלמים */
      }
    }
    handlers.onEnd?.();
  };

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        /* מתעלמים */
      }
    },
    abort: () => {
      stopped = true;
      try {
        recognition.abort();
      } catch {
        /* מתעלמים */
      }
    },
  };
}
