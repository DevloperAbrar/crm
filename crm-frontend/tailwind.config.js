/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF1F8',
          100: '#D6DBEA',
          200: '#AEB7D5',
          300: '#7E8AB8',
          400: '#3F4C82',
          500: '#0C132D', // Campussafar navy (primary)
          600: '#0A1026',
          700: '#080C1D',
          800: '#060915',
          900: '#03050C',
        },
        accent: {
          50: '#FFF3E9',
          100: '#FFE1C7',
          200: '#FFC08A',
          300: '#FD9F52',
          400: '#FB8A2D',
          500: '#FA700D', // Campussafar orange (accent)
          600: '#E0620A',
          700: '#B84E08',
          800: '#8F3C06',
          900: '#662B05',
        },
      },
    },
  },
  plugins: [],
};
