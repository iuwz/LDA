/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        "brand-dark":   "var(--brand-dark)",
        "accent-dark":  "var(--accent-dark)",
        "accent-light": "var(--accent-light)",
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
};
