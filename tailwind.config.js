const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  darkMode: "class",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        dark: {
          background: "#18181b", // Zinc 900
          text: "#f4f4f5",        // Zinc 100
          card: "#27272a",        // Zinc 800
          border: "#3f3f46",      // Zinc 700
          "subtle-text": "#a1a1aa", // Zinc 400
        },
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      // --- ADD ANIMATIONS ---
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
      },
      // --- END ANIMATIONS ---
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};