/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:           "var(--bg)",
        surface:      "var(--bg-surface)",
        elevated:     "var(--bg-elevated)",
        border:       "var(--border)",
        accent:       "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",
      },
      fontFamily: {
        sans: ["var(--font-primary)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      animation: {
        "shimmer-slide": "shimmer-slide 2s infinite",
        "fade-up":       "fade-up 0.25s ease forwards",
        "sparkle":       "sparkle 2s ease-in-out infinite",
        "pulse-glow":    "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "shimmer-slide": {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "0.8" },
          "50%":       { transform: "scale(1.2) rotate(15deg)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%":       { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
