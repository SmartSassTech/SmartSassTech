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
        'kb-slate': '#3D4663',
        'kb-muted': '#5C6078',
        'kb-light': '#8E8D9A',
        'kb-pale': '#D1D6E0',
        'kb-dark': '#2D2D2D',
        'kb-bg': '#F0F0F0',
        // SST Branding Aliases
        'sst-primary': '#2E3B69',
        'sst-secondary': '#3D4663',
        'sst-beige': '#E3DDDC',
        'sst-accent': '#5C6078',
        // Distinct Accents that pair with Navy
        'kb-blue': '#2E3B69',
        'kb-teal': '#2A9D8F',
        'kb-purple': '#9D4EDD',
        'kb-orange': '#E76F51',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        heading: ['Futura', 'Didact Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
