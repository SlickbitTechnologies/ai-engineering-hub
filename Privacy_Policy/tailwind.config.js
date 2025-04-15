/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#EBF5FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0080FF', // Main primary color
          600: '#0066CC',
          700: '#004D99',
          800: '#003366',
          900: '#001933',
        },
        // Secondary accent color
        secondary: {
          50: '#F0F4FD',
          100: '#D8E3F8',
          200: '#B1C7F2',
          300: '#8AABEC',
          400: '#638FE5',
          500: '#3C73DF', // Main secondary color
          600: '#2A5BC4',
          700: '#1E4499',
          800: '#132E6F',
          900: '#091744',
        },
        // Neutral colors
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
};