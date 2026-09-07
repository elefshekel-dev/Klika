import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Fragment, Settings } from '@/db/types';
import { detectDir } from '@/lib/direction';
import { textStats } from '@/lib/textStats';

interface Props {
  fragment: Fragment;
  settings: Settings;
  /** נקרא בכל שינוי תוכן — האחראי משהה (debounce) בעצמו. */
  onChange: (content: string) => void;
  autoFocus?: boolean;
}

/**
 * משטח הכתיבה עצמו. textarea נקי, מלא-גובה, עם:
 * - כיוון אוטומטי לפי התוכן (RTL לעברית).
 * - שבירות שורה קדושות (pre-wrap, בלי format).
 * - טיפוגרפיה נשלטת מההגדרות (גודל, רוחב שורה, גופן).
 * - מונה מילים/שורות דיסקרטי בפינה.
 */
export default function EditorSurface({ fragment, settings, onChange, autoFocus }: Props) {
  const [value, setValue] = useState(fragment.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // כשהרסיס מתחלף (ניווט prev/next) — טוענים את התוכן החדש.
  useEffect(() => {
    setValue(fragment.content);
  }, [fragment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // מיקוד אוטומטי עם סמן בסוף — כניסה מיידית לכתיבה.
  useLayoutEffect(() => {
    if (autoFocus && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [autoFocus, fragment.id]);

  const dir = detectDir(value);
  const stats = textStats(value);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    onChange(next);
  };

  const fontFamily =
    settings.editorFont === 'reading'
      ? '"Frank Ruhl Libre", Georgia, serif'
      : '"Assistant", system-ui, sans-serif';

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto scroll-y px-5 py-6">
        <textarea
          ref={textareaRef}
          className="editor-textarea mx-auto block h-full w-full resize-none border-0 bg-transparent leading-relaxed text-ink-900 outline-none placeholder:text-ink-400"
          dir={dir}
          value={value}
          onChange={handleInput}
          placeholder="כתבי כאן…"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            fontFamily,
            fontSize: `${settings.editorFontSize}px`,
            lineHeight: 1.7,
            maxWidth: `${settings.editorLineWidth}ch`,
            minHeight: '100%',
          }}
        />
      </div>

      {settings.showCounter && (
        <div className="pointer-events-none absolute bottom-2 left-3 select-none text-xs text-ink-400">
          {stats.words} מילים · {stats.lines} שורות
        </div>
      )}
    </div>
  );
}
