/** @type {import('tailwindcss').Config} */
export default {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      opacity: {
        '7': '0.07',
        '9': '0.09'
      }
    },
  },
  plugins: [],
}