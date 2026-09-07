import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import LibraryPage from './features/library/LibraryPage';
import EditorPage from './features/editor/EditorPage';
import SettingsPage from './features/settings/SettingsPage';
import CollectionsListPage from './features/collections/CollectionsListPage';
import CollectionPage from './features/collections/CollectionPage';
import ContinuousReadPage from './features/collections/ContinuousReadPage';
import Fab from './components/Fab';
import { createFragment } from './db/fragments';
import { ensureSettings } from './db/settings';
import { useViewportHeight } from './hooks/useViewportHeight';
import { db } from './db/db';

const FIRST_RUN_KEY = 'resisim.launched';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditor = location.pathname.startsWith('/f/');
  // מסתירים את כפתור הלכידה במסכים ממוקדים: עורך, הגדרות, ותצוגת אסופה/קריאה רצופה.
  const hideFab =
    isEditor ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/collections/');

  // גובה חלון תצוגה דינמי — כדי שהמקלדת בנייד לא תחתוך את העורך.
  useViewportHeight();

  // יצירת שורת ההגדרות פעם אחת (מחוץ ל-liveQuery).
  useEffect(() => {
    void ensureSettings();
  }, []);

  // כניסה ראשונה אי-פעם: פותחים ישר עורך עם הסמן בפנים (בלי onboarding).
  const firstRunChecked = useRef(false);
  useEffect(() => {
    if (firstRunChecked.current) return;
    firstRunChecked.current = true;
    let launched = false;
    try {
      launched = localStorage.getItem(FIRST_RUN_KEY) === '1';
    } catch {
      launched = true; // אם אין localStorage — לא כופים כניסה ראשונה.
    }
    if (launched || location.pathname !== '/') return;
    void db.fragments.count().then(async (n) => {
      if (n === 0) {
        try {
          localStorage.setItem(FIRST_RUN_KEY, '1');
        } catch {
          /* מתעלמים */
        }
        const f = await createFragment();
        navigate(`/f/${f.id}`, { replace: true });
      }
    });
  }, [location.pathname, navigate]);

  return (
    <div
      className="relative mx-auto flex w-full max-w-4xl flex-col overflow-hidden bg-paper-50"
      style={{ height: 'var(--app-vh, 100dvh)' }}
    >
      <div className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/f/:id" element={<EditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/collections" element={<CollectionsListPage />} />
          <Route path="/collections/:id" element={<CollectionPage />} />
          <Route path="/collections/:id/read" element={<ContinuousReadPage />} />
          <Route path="*" element={<LibraryPage />} />
        </Routes>
      </div>
      {!hideFab && <Fab />}
    </div>
  );
}
