/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fb',
          100: '#e7ebf5',
          200: '#cdd7ea',
          300: '#a7b9d8',
          400: '#7d93c2',
          500: '#5f73ad',
          600: '#4b5d90',
          700: '#3d4a71',
          800: '#2b344f',
          900: '#161b2b',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(17, 24, 39, 0.35)',
      },
    },
  },
  plugins: [],
};
