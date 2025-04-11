/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#00aff0',
        secondary: '#2ecc71',
        danger: '#e74c3c',
        warning: '#f1c40f',
        info: '#1abc9c',
        lightsky: '#e0f2fe',
        lightblue: '#00aff0'
      },
    },
  },
  plugins: [],
}; 