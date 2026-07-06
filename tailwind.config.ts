import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        background: "#F5F5F7",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1D1D1F",
          soft: "#6E6E73",
          faint: "#9A9AA0",
        },
        border: {
          DEFAULT: "#E5E5E9",
          soft: "#EEEEF1",
        },
        brand: {
          50: "#EFFCFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0F766E",
          700: "#0B5D57",
          800: "#0A4A46",
          900: "#083A37",
        },
        success: {
          DEFAULT: "#16A34A",
          soft: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(29,29,31,0.04), 0 2px 8px -2px rgba(29,29,31,0.06)",
        card: "0 1px 3px 0 rgba(29,29,31,0.05), 0 8px 24px -8px rgba(29,29,31,0.08)",
        lift: "0 12px 32px -8px rgba(29,29,31,0.16)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "rise-in": "rise-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
