/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'chateau-green': {
          '50': '#f0fdf5',
          '100': '#dcfce8',
          '200': '#bbf7d1',
          '300': '#86efad',
          '400': '#4ade81',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803c',
          '800': '#166533',
          '900': '#14532b',
          '950': '#052e14',
        },
      },
    },
  },
  plugins: [],
}

