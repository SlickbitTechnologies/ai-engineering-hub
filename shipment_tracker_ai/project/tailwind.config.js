/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f5f8',
          100: '#ccecf1',
          200: '#99d8e3',
          300: '#66c5d5',
          400: '#33b1c7',
          500: '#0e9db9',
          600: '#0b7e94',
          700: '#0e7490',
          800: '#075e73',
          900: '#064e5e',
        },
        secondary: {
          50: '#e6fafc',
          100: '#ccf4f9',
          200: '#99eaf3',
          300: '#66dfed',
          400: '#33d5e7',
          500: '#0bcae1',
          600: '#0aa2b4',
          700: '#0891b2',
          800: '#076e86',
          900: '#065a6e',
        },
        accent: {
          50: '#fff6ed',
          100: '#ffecda',
          200: '#ffd9b6',
          300: '#ffc691',
          400: '#ffb36d',
          500: '#ffa048',
          600: '#f97316',
          700: '#c75c11',
          800: '#95450d',
          900: '#632e09',
        },
        success: {
          500: '#16a34a',
        },
        warning: {
          500: '#fbbf24',
        },
        error: {
          500: '#dc2626',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};