/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ffe9f3',
          100: '#ffd1e6',
          200: '#f9a9cc',
          300: '#f280b3',
          400: '#e25a97',
          500: '#d30874',
          600: '#b40764',
          700: '#9b0658',
        },
      },
    },
  },
  plugins: [],
}
