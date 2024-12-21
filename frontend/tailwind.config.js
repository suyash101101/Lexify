/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
          },
          secondary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
          }
        },
        backgroundColor: {
          'glass': 'rgba(255, 255, 255, 0.8)',
        },
        backdropFilter: {
          'glass': 'blur(12px)',
        },
        animation: {
          'blob': 'blob 7s infinite',
          'float': 'float 6s ease-in-out infinite',
          'glow': 'glow 2s ease-in-out infinite alternate',
        },
        keyframes: {
          blob: {
            '0%': { transform: 'translate(0px, 0px) scale(1)' },
            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
            '100%': { transform: 'translate(0px, 0px) scale(1)' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          glow: {
            '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.5)' },
            '100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.8)' },
          },
        },
      },
    },
    plugins: [],
  }
  
  