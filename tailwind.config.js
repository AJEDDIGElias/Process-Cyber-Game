/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030712',
          surface: '#0a0f1e',
          panel: '#0d1528',
          border: '#1e3a5f',
          cyan: '#00d4ff',
          blue: '#3b82f6',
          green: '#00ff88',
          red: '#ff3b3b',
          orange: '#f59e0b',
          purple: '#8b5cf6',
          yellow: '#facc15',
        }
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'card-in': 'cardIn 0.35s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,212,255,0.7), 0 0 40px rgba(0,212,255,0.3)' },
        },
        cardIn: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

