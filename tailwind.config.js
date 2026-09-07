/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // פלטת "נייר" חמה — נעימה לכתיבה ממושכת.
        paper: {
          50: '#faf9f7',
          100: '#f4f2ee',
          200: '#e8e4dd',
          300: '#d6cfc3',
        },
        ink: {
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          500: '#78716c',
          400: '#a8a29e',
        },
      },
      fontFamily: {
        // גופן קריאה נעים לעברית, עם נפילה לגופני מערכת.
        reading: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
        sans: ['"Assistant"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
