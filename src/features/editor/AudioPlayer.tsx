import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getRecording, deleteRecording } from '@/db/recordings';
import { IconPlay, IconPause, IconTrash, IconMic } from '@/components/icons';

interface Props {
  fragmentId: string;
}

function fmt(ms: number): string {
  if (!ms || !isFinite(ms)) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * נגן אודיו לפתק קולי. מוצג בעורך רק אם קיימת הקלטה לרסיס. האודיו מקומי למכשיר.
 */
export default function AudioPlayer({ fragmentId }: Props) {
  const recording = useLiveQuery(() => getRecording(fragmentId), [fragmentId]);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // יוצר object URL מה-blob, ומשחרר אותו כשמתחלף/יורד מהמסך.
  useEffect(() => {
    if (!recording) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(recording.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [recording]);

  if (!recording || !url) return null;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-paper-200 bg-white/60 px-3 py-2" dir="rtl">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-100 text-ink-500">
        <IconMic size={16} />
      </span>
      <button
        onClick={toggle}
        aria-label={playing ? 'השהיה' : 'ניגון'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-paper-50"
      >
        {playing ? <IconPause size={16} /> : <IconPlay size={16} />}
      </button>
      <span className="flex-1 text-sm text-ink-500">
        פתק קולי{recording.durationMs ? ` · ${fmt(recording.durationMs)}` : ''}
      </span>
      <button
        onClick={() => void deleteRecording(fragmentId)}
        aria-label="מחיקת ההקלטה"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:text-rose-600"
      >
        <IconTrash size={16} />
      </button>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        hidden
      />
    </div>
  );
}
