/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
      },
      colors: {
        // Mint & Teal Design System (Exact Brand Specifications)
        mint: {
          light: '#E3FDFD',      // Light mint: subtle backgrounds & empty states
          pale: '#CBF1F5',       // Pale aqua: subtle surfaces, selected filters, info panels
          soft: '#A6E3E9',       // Mint teal: secondary visual elements, badges
          teal: '#71C9CE',       // Teal: interactive accents, charts, highlights
          dark: '#244653',       // Dark teal: primary brand color, buttons, headers
          darkHover: '#1B353F',  // Dark teal hover state
          darker: '#172B32',     // Primary text: dark, highly readable neutral
          muted: '#4E6770',      // Secondary text: muted neutral
          border: '#D5EDED',     // Subtle pale teal / cool border
          borderLight: '#E8F7F7',// Very soft divider
          surface: '#F8FBFA',    // Main page background: light neutral
        },
        brand: {
          50: '#E3FDFD',
          100: '#CBF1F5',
          200: '#A6E3E9',
          300: '#8EDAE0',
          400: '#71C9CE',
          500: '#54B5BC',
          600: '#3D9298',
          700: '#2F6B75',
          800: '#244653',
          900: '#172B32',
        }
      }
    },
  },
  plugins: [],
}
