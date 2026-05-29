/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002045',
          steel: '#1a365d',
        },
        teal: {
          DEFAULT: '#006b5f',
          darker: '#007165',
        },
        mint: {
          DEFAULT: '#62fae3',
        },
        ice: {
          light: '#f8f9ff',
          pale: '#eff4ff',
          medium: '#dce9ff',
        },
        slate: {
          dark: '#0b1c30',
          light: '#43474e',
          mid: '#74777f',
          border: '#c4c6cf',
        },
        error: {
          DEFAULT: '#ba1a1a',
          bg: '#ffdad6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'title-lg': ['"Hanken Grotesk"', 'sans-serif'],
        title: ['"Hanken Grotesk"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
