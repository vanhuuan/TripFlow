/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        coast: "#0f766e",
        sunrise: "#f59e0b",
        coral: "#e11d48",
      },
    },
  },
  plugins: [],
};
