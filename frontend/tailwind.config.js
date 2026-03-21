/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
    'brand-blue': '#00478F',   // Biru dari Toga
    'brand-orange': '#FF9500', // Orange dari Tas
    'brand-dark': '#050C16',   // Navy Gelap agar logo "pop out"
    },
      fontFamily: {
        sans: ['"Lexend Deca"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}