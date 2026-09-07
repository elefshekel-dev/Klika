import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { updateSettings } from '@/db/settings';
import { IconArrowRight } from '@/components/icons';
import TagManager from './TagManager';
import SyncSection from './SyncSection';
import DataSection from './DataSection';

/** מסך הגדרות: טיפוגרפיה של העורך וניהול תגיות. */
export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettings();

  return (
    <div className="scroll-y h-full pb-28" dir="rtl">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-paper-200 bg-paper-50/90 px-2 py-2 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200"
        >
          <IconArrowRight />
        </button>
        <h1 className="font-reading text-xl text-ink-900">הגדרות</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-5">
        {/* טיפוגרפיה של העורך. */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-700">העורך</h2>

          <label className="block">
            <div className="mb-1 flex justify-between text-sm text-ink-600">
              <span>גודל גופן</span>
              <span className="text-ink-400">{settings.editorFontSize}px</span>
            </div>
            <input
              type="range"
              min={15}
              max={28}
              value={settings.editorFontSize}
              onChange={(e) => void updateSettings({ editorFontSize: Number(e.target.value) })}
              className="w-full accent-ink-800"
            />
          </label>

          <label className="block">
            <div className="mb-1 flex justify-between text-sm text-ink-600">
              <span>רוחב שורה</span>
              <span className="text-ink-400">{settings.editorLineWidth} תווים</span>
            </div>
            <input
              type="range"
              min={24}
              max={60}
              value={settings.editorLineWidth}
              onChange={(e) => void updateSettings({ editorLineWidth: Number(e.target.value) })}
              className="w-full accent-ink-800"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-600">גופן</span>
            <div className="flex overflow-hidden rounded-full border border-paper-300 text-sm">
              {(['reading', 'sans'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => void updateSettings({ editorFont: font })}
                  className={`px-3 py-1 ${
                    settings.editorFont === font ? 'bg-ink-900 text-paper-50' : 'text-ink-500'
                  }`}
                >
                  {font === 'reading' ? 'קריאה' : 'נקי'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm text-ink-600">מונה מילים ושורות</span>
            <input
              type="checkbox"
              checked={settings.showCounter}
              onChange={(e) => void updateSettings({ showCounter: e.target.checked })}
              className="h-5 w-5 accent-ink-800"
            />
          </label>
        </section>

        <SyncSection />

        <TagManager />

        <DataSection />
      </div>
    </div>
  );
}
