/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        glassLight: "rgba(255,255,255,0.15)",
        glassDark: "rgba(255,255,255,0.05)",
        glassBorder: "rgba(255,255,255,0.2)"
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.12)"
      },
      fontFamily: {
        heading: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-manrope)", "sans-serif"]
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" }
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 14s ease-in-out infinite",
        shimmer: "shimmer 3.5s linear infinite"
      }
    }
  },
  plugins: [],
};

