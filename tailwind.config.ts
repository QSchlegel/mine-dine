import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS variable based colors for theme switching
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary vibrant pink/purple (youthful, energetic)
        coral: {
          50: "#FDF2F8",
          100: "#FCE7F3",
          200: "#FBCFE8",
          300: "#F9A8D4",
          400: "#F472B6",
          500: "#EC4899", // Primary vibrant pink
          600: "#DB2777",
          700: "#BE185D",
          800: "#9F1239",
          900: "#831843",
        },

        // Accent electric cyan (fresh, modern)
        accent: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4", // Primary accent cyan
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },

        // Purple tertiary
        purple: {
          400: "#B49AD1",
          500: "#987CB0",
          600: "#7D5F99",
        },

        // Semantic colors
        success: {
          50: "#ECFDF5",
          500: "#30A46C",
          600: "#2A9260",
        },
        warning: {
          50: "#FFFBEB",
          500: "#F5A623",
          600: "#DB9520",
        },
        danger: {
          50: "#FEF2F2",
          500: "#E5484D",
          600: "#CD3D41",
        },

        // Dark mode backgrounds
        void: "#0A0A0F",
        space: "#0D0D12",
        nebula: "#151520",
        cosmic: "#1C1C28",

        // Light mode backgrounds
        surface: {
          50: "#FFFFFF",
          100: "#FAFAFA",
          200: "#F5F5F5",
          300: "#EEEEEE",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "Menlo", "monospace"],
      },

      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },

      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },

      boxShadow: {
        "glow-coral": "0 0 24px rgba(236, 72, 153, 0.35), 0 0 8px rgba(236, 72, 153, 0.2)",
        "glow-coral-lg": "0 0 40px rgba(236, 72, 153, 0.45), 0 0 16px rgba(236, 72, 153, 0.3)",
        "glow-blue": "0 0 24px rgba(6, 182, 212, 0.35), 0 0 8px rgba(6, 182, 212, 0.2)",
        "glow-blue-lg": "0 0 40px rgba(6, 182, 212, 0.45), 0 0 16px rgba(6, 182, 212, 0.3)",
        "glow-pink": "0 0 24px rgba(236, 72, 153, 0.35), 0 0 8px rgba(236, 72, 153, 0.2)",
        "glow-cyan": "0 0 24px rgba(6, 182, 212, 0.35), 0 0 8px rgba(6, 182, 212, 0.2)",
        "glow-soft": "0 0 20px currentColor",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4)",
        "elevated": "0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)",
        "elevated-dark": "0 4px 20px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.5)",
        "refined": "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
        "refined-lg": "0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)",
      },

      backdropBlur: {
        xs: "2px",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
        "grid-pattern-light": "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      },

      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;
