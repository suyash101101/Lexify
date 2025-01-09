/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Greycliff CF', 'system-ui', 'sans-serif'],
        display: ['Greycliff CF', 'system-ui', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      colors: {
        primary: {
          main: '#1A1A1A',
        },
        accent: {
          white: '#FFFFFF',
          gray: '#F5F5F5',
        },
      },
    },
  },
  plugins: [],
}
  
  