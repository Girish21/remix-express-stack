const theme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./app/**/*.{jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...theme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
