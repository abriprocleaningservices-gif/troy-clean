/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f2f7f4",
          100: "#dfebe3",
          200: "#b9d5c4",
          300: "#8fbba0",
          400: "#5f9a78",
          500: "#3f7d5a",
          600: "#2f6347",
          700: "#294f3a",
          800: "#234030",
          900: "#1c3527",
          950: "#0e1d16",
        },
        clay: {
          50: "#fbf6f0",
          100: "#f3e6d6",
          200: "#e6c9a8",
          300: "#d6a56e",
          400: "#c6863f",
          500: "#a96a2b",
          600: "#8a5423",
          700: "#6d4220",
          800: "#57361f",
          900: "#492e1e",
        },
        ink: "#161a17",
        paper: "#faf8f4",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
