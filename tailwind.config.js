/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'aurora': 'aurora 15s linear infinite',
        'slide-slow': 'slide 20s linear infinite',
        'slide-slow-reverse': 'slide 20s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        aurora: {
          '0%': { transform: 'translate(0%, 0%) rotate(12deg)' },
          '100%': { transform: 'translate(-50%, 0%) rotate(12deg)' },
        },
        slide: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      fontFamily: {
        'display': ['Cal Sans', 'Inter var', 'sans-serif'],
      },
      animationDelay: {
        '2000': '2000ms',
        '4000': '4000ms',
      }
    },
  },
  plugins: [],
} 