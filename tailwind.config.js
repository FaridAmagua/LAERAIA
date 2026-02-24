import typographyPlugin from '@tailwindcss/typography'

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './content/**/*.{md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [typographyPlugin],
}
