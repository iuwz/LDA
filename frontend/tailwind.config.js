/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Include the HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Include all files in the src folder with these extensions
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans:  ['Inter', 'sans-serif'],
      },
      lineHeight: {
        loose:   '1.8',
        relaxed: '1.75',
      },
      /* ─── expose the :root tokens ─── */
      colors: {
        'brand-dark':  'var(--brand-dark)',
        'accent-dark': 'var(--accent-dark)',
        'accent-light':'var(--accent-light)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [
    // Include any official Tailwind plugins you might want, e.g.:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
