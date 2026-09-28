/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f7ef',
          100: '#e7ead3',
          200: '#d0d7ab',
          300: '#b7c37f',
          400: '#a1b05f',
          500: '#849448',
          600: '#6a773a',
          700: '#525d30',
          800: '#434c2a',
          900: '#3b4128',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(14, 23, 38, 0.25)',
      },
      backgroundImage: {
        'page-glow':
          'radial-gradient(circle at 15% 20%, rgba(132, 148, 72, 0.18), transparent 45%), radial-gradient(circle at 85% 0%, rgba(17, 120, 101, 0.18), transparent 38%), linear-gradient(180deg, #f5f7f1 0%, #eef1e8 100%)',
      },
    },
  },
  plugins: [],
}
