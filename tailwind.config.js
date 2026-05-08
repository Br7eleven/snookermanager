/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f172a',
          light: '#1e293b'
        },
        emerald: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#d1fae5'
        },
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7'
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          600: '#475569',
          800: '#1e293b'
        }
      },
    },
  },
  plugins: [],
}
