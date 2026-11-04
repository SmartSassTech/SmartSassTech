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
        // SST Branding Palette
        'sst-primary': '#2E3B69', // SmartSass Navy Blue
        'sst-primary-dark': '#222C4E', // Deep Navy for hover/depth
        'sst-secondary': '#3D4D80', // Rich Slate Navy
        'sst-beige': '#F8FAFC', // Clean Light Slate / Background
        'sst-bg-light': '#F8FAFC', // Clean Light Background
        'sst-accent': '#2E3B69', // Primary brand navy (red accent removed)
        'sst-teal': '#2E3B69', // Legacy alias
        'sst-red': '#B24536', // Error status alert red
        'sst-dark': '#1E293B', // High contrast text slate
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        heading: ['Outfit', 'Futura', 'Didact Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
