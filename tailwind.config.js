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
        // Hijau daun lembut: untuk status aman, laba sehat & KPI positif
        success: {
          50: '#EFFAF3',
          100: '#D9F3E2',
          200: '#B5E6C8',
          300: '#84D2A4',
          400: '#4FB87C',
          500: '#2E9B60',
          600: '#1F7D4B',
          700: '#18633C',
          800: '#144F31',
          900: '#104028',
          950: '#072416',
        },
        // Merah lembut: untuk status bahaya, rugi & stok kritis
        danger: {
          50: '#FEF2F2',
          100: '#FDE2E1',
          200: '#FBC8C6',
          300: '#F5A19E',
          400: '#EA6F6B',
          500: '#D94844',
          600: '#C0322E',
          700: '#9F2522',
          800: '#83211F',
          900: '#6B1F1D',
          950: '#3B0D0C',
        },
        // Kuning amber lembut: untuk peringatan, hati-hati & margin tipis
        warning: {
          50: '#FEFBE8',
          100: '#FDF3C4',
          200: '#FBE48B',
          300: '#F5CD4F',
          400: '#E8B225',
          500: '#CA8E12',
          600: '#A66D0C',
          700: '#85510B',
          800: '#6D400E',
          900: '#593410',
          950: '#341B05',
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
