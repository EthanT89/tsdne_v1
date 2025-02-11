/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Ensure Tailwind scans all relevant files
  theme: {
    extend: {
      fontFamily: {
        annie: ["'Annie Use Your Telescope'", "cursive"], // Add custom font
      },
    },
  },
  plugins: [],
};