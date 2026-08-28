/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
        },
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
        }
      }
    },
  },
  plugins: [],
}
