/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soga: {
          900: '#582F0E',
          800: '#7F4F24',
          700: '#936639',
          600: '#A68A64',
          400: '#B6AD90',
        },
        sage: {
          200: '#C2C5AA',
          400: '#A4AC86',
          600: '#656D4A',
        },
        forest: {
          800: '#414833',
          900: '#333D29',
        },
        canvas: {
          50: '#FAF8F4',
          100: '#F3EFE6',
          200: '#E8E2D5',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(51, 61, 41, 0.08)',
        card: '0 10px 30px -6px rgba(88, 47, 14, 0.08)',
        elevated: '0 18px 40px -10px rgba(51, 61, 41, 0.16)',
      },
    },
  },
  plugins: [],
};
