/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Include the HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Include all files in the src folder with these extensions
  ],
  theme: {
    extend: {
      // Example: Custom font families
      fontFamily: {
        // Provide a fallback if the custom font fails to load
        serif: ["Merriweather", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      // Example: Custom line heights
      lineHeight: {
        loose: "1.8", // Slightly looser than default
        relaxed: "1.75",
      },
      // Example: Custom colors (if you want more brand colors)
      colors: {
        brandGold: "#C17829",
        brandDark: "#2C2C4A",
      },
      // Example: Additional spacing values
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [
    // Include any official Tailwind plugins you might want, e.g.:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
