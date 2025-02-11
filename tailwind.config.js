/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}" // Ensures Tailwind scans all your components
  ],
  theme: {
    extend: {
      fontFamily: {
        annie: ["'Annie Use Your Telescope'", "cursive"], // Fix incorrect syntax
      },
    },
  },
  plugins: [],
};
