import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f2fbf4',
          100: '#e0f6e6',
          200: '#c2ecce',
          300: '#93dcab',
          400: '#5cc483',
          500: '#36a960',
          600: '#268b4d',
          700: '#206e40',
          800: '#1d5735',
          900: '#19482e',
        },
        irrig: {
          50: '#eff7fb',
          100: '#d9ecf6',
          200: '#b7dcef',
          300: '#85c3e3',
          400: '#4ca5d3',
          500: '#2b8abf',
          600: '#1f6fa2',
          700: '#1b5a83',
          800: '#1a4b6c',
          900: '#1a3f5b',
        },
        ink: {
          900: '#0b1c16',
          800: '#122a21',
          700: '#1d4032',
          600: '#2b5946',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,42,32,0.06), 0 4px 16px rgba(16,42,32,0.08)',
        lift: '0 2px 4px rgba(16,42,32,0.08), 0 12px 32px rgba(16,42,32,0.14)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;