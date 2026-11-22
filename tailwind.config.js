/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          950: '#090b10',
          900: '#0f1219',
          800: '#161b24',
          700: '#212734',
        },
        ivory: {
          100: '#f3eee4',
          200: '#d9d1c3',
          300: '#9c968b',
        },
        paper: {
          50: '#fcfaf5',
          100: '#f5f1e8',
          200: '#ebe4d6',
          700: '#6e6659',
          800: '#3c372f',
          900: '#1a1815',
        },
        gold: {
          200: '#f6d79c',
          300: '#efc06e',
          400: '#e8a849',
          500: '#c78322',
          600: '#a36612',
        },
      },
      keyframes: {
        'flame-breathe': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.07)' },
        },
        'mist-drift-slow': {
          '0%, 100%': { transform: 'translateX(-4%)' },
          '50%': { transform: 'translateX(4%)' },
        },
        'mist-drift-reverse': {
          '0%, 100%': { transform: 'translateX(4%)' },
          '50%': { transform: 'translateX(-4%)' },
        },
        'star-pulse': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.85' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '20%': { opacity: '0.65' },
          '80%': { opacity: '0.35' },
          '100%': { transform: 'translateY(-110px) translateX(14px)', opacity: '0' },
        },
      },
      animation: {
        'flame-breathe': 'flame-breathe 3.4s ease-in-out infinite',
        'mist-drift-slow': 'mist-drift-slow 24s ease-in-out infinite',
        'mist-drift-reverse': 'mist-drift-reverse 30s ease-in-out infinite',
        'star-pulse': 'star-pulse 5s ease-in-out infinite',
        'ember-rise': 'ember-rise 7s ease-out infinite',
      },
    },
  },
  plugins: [],
};
