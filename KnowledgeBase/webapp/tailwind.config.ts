import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kb-navy': '#2E3B69',
        'kb-cream': '#E3DDDC',
        'kb-slate': '#5B6486',
        'kb-muted': '#898CA3',
        'kb-light': '#B6B5BF',
        'kb-pale': '#D1D6E0',
        'kb-dark': '#4A4A4A',
        'kb-bg': '#F0F0F0',
        // Distinct Accents that pair with Navy
        'kb-blue': '#2E3B69', // existing navy alias
        'kb-teal': '#2A9D8F',
        'kb-purple': '#9D4EDD',
        'kb-orange': '#E76F51',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
