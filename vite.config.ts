import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// נתיב הבסיס. ברירת מחדל '/' (פיתוח מקומי ופריסה לשורש). לפריסה תחת תת-נתיב
// (כמו GitHub Pages ב-/Klika/) מגדירים VITE_BASE בזמן הבנייה.
const base = process.env.VITE_BASE || '/';

// אפליקציה סטטית בלבד — אין backend. Local-first עם PWA לעבודה אופליין.
export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'רסיסים',
        short_name: 'רסיסים',
        description: 'מחברת רסיסים — לכידה מהירה של טקסטים קצרים',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#1c1917',
        background_color: '#faf9f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // כל הנכסים הסטטיים נשמרים ל-cache כדי לעבוד אופליין לחלוטין.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
        // Google Identity Services וקריאות ה-Drive לא נשמרות ב-cache.
        navigateFallbackDenylist: [/^\/api/, /accounts\.google\.com/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
