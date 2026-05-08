/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "ui-sans-serif", "system-ui"],
        body: ["DM Sans", "ui-sans-serif", "system-ui"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      colors: {
        navy: {
          950: "#03060f",
          900: "#060d1f",
          800: "#0a1428",
          700: "#0f1e38",
          600: "#152644",
        },
        cyan: {
          DEFAULT: "#06b6d4",
          50: "#ecfeff",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        "slide-right": "slideRight 0.3s ease-out both",
        "scale-in": "scaleIn 0.3s ease-out both",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(6,182,212,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(245,158,11,0.05) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 20px rgba(6,182,212,0.15)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.15)",
      },
    },
  },
  plugins: [],
};
