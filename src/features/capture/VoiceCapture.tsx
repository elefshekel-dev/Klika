import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFragment, updateFragmentContent } from '@/db/fragments';
import { saveRecording } from '@/db/recordings';
import { startSpeech, isSpeechSupported, type SpeechSession } from '@/lib/speech';
import { detectDir } from '@/lib/direction';
import { IconMic, IconStop, IconX } from '@/components/icons';

interface Props {
  onClose: () => void;
}

// בוחר סוג mime נתמך להקלטה.
function pickMime(): string {
  const candidates = ['audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * לכידה קולית: מקליט אודיו (MediaRecorder) ומתמלל חי בעברית (Web Speech).
 * בסיום — יוצר רסיס עם התמלול, שומר את האודיו מקומית, ופותח את הרסיס לעריכה.
 * הכל מקומי, בלי backend.
 */
export default function VoiceCapture({ onClose }: Props) {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const speechSupported = isSpeechSupported();

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRef = useRef<SpeechSession | null>(null);
  const startedAt = useRef<number>(0);
  const finalRef = useRef('');
  const savingRef = useRef(false);

  // מפעיל מיקרופון, מקליט, ומתמלל — פעם אחת בעליית הרכיב.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // תמלול חי (עצמאי מההקלטה — לו מיקרופון משלו).
      if (speechSupported) {
        speechRef.current = startSpeech({
          onTranscript: (f, i) => {
            finalRef.current = f;
            setFinalText(f);
            setInterim(i);
          },
          onError: (e) => setError(`תמלול נכשל: ${e}`),
        });
      }

      // הקלטת אודיו (אופציונלית — אם נכשלת, התמלול עדיין עובד).
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const mime = pickMime();
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
        rec.start();
        recorderRef.current = rec;
      } catch {
        if (!speechSupported) {
          setError('אין גישה למיקרופון. בדקי הרשאות בדפדפן.');
        }
      }

      startedAt.current = Date.now();
      setReady(true);
    })();

    const timer = setInterval(() => {
      if (startedAt.current) setElapsed(Date.now() - startedAt.current);
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(timer);
      speechRef.current?.abort();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // עוצר את כל המשאבים ומחזיר את blob האודיו (אם יש).
  const stopAll = (): Promise<{ blob: Blob | null; mime: string; duration: number }> => {
    const duration = startedAt.current ? Date.now() - startedAt.current : 0;
    speechRef.current?.stop();
    const rec = recorderRef.current;
    return new Promise((resolve) => {
      if (rec && rec.state !== 'inactive') {
        rec.onstop = () => {
          const mime = rec.mimeType || 'audio/webm';
          const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: mime }) : null;
          streamRef.current?.getTracks().forEach((t) => t.stop());
          resolve({ blob, mime, duration });
        };
        rec.stop();
      } else {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        resolve({ blob: null, mime: '', duration });
      }
    });
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const { blob, mime, duration } = await stopAll();
    const content = finalRef.current.trim();

    // אם אין תמלול ואין אודיו — אין מה לשמור.
    if (!content && !blob) {
      onClose();
      return;
    }

    const fragment = await createFragment();
    if (content) await updateFragmentContent(fragment.id, content);
    if (blob) await saveRecording(fragment.id, blob, mime, duration);
    onClose();
    navigate(`/f/${fragment.id}`);
  };

  const cancel = async () => {
    await stopAll();
    onClose();
  };

  const preview = (finalText + (interim ? ' ' + interim : '')).trim();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-50" dir="rtl">
      {/* כותרת עם ביטול */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => void cancel()}
          aria-label="ביטול"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconX />
        </button>
        <span className="font-mono text-sm text-ink-500">{fmt(elapsed)}</span>
      </div>

      {/* אזור התמלול החי */}
      <div className="scroll-y min-h-0 flex-1 px-6 py-4">
        {error ? (
          <p className="mt-8 text-center text-sm text-rose-600">{error}</p>
        ) : preview ? (
          <p
            className="whitespace-pre-wrap break-words font-reading text-lg leading-relaxed text-ink-800"
            dir={detectDir(preview)}
          >
            {finalText}
            {interim && <span className="text-ink-400"> {interim}</span>}
          </p>
        ) : (
          <p className="mt-8 text-center text-sm text-ink-400">
            {ready
              ? speechSupported
                ? 'מקשיבה… דברי, והטקסט יופיע כאן.'
                : 'מקליטה… (תמלול אוטומטי לא נתמך בדפדפן הזה — האודיו יישמר ותוכלי להקליד).'
              : 'מפעילה מיקרופון…'}
          </p>
        )}
      </div>

      {/* בקרת עצירה — כפתור גדול בהישג אגודל */}
      <div
        className="flex flex-col items-center gap-3 px-6 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        <div className="flex items-center gap-2 text-ink-400">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
          <IconMic size={16} />
        </div>
        <button
          onClick={() => void save()}
          aria-label="סיום ושמירה"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-900 text-paper-50 shadow-lg transition active:scale-95"
        >
          <IconStop size={30} />
        </button>
        <span className="text-xs text-ink-400">הקישי לסיום ושמירה</span>
      </div>
    </div>
  );
}
