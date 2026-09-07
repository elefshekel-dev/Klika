import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// basename מגיע מנתיב הבסיס של Vite (BASE_URL) — כדי שהניתוב יעבוד גם כשהאתר
// מתארח תחת תת-נתיב (למשל GitHub Pages ב-/Klika/).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
