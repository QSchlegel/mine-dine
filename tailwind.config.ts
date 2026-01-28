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

        // Primary warm coral/rose (inviting, warm)
        coral: {
          50: "#FEF5F6",
          100: "#FDE8EB",
          200: "#FBD0D8",
          300: "#F7A8B6",
          400: "#F17A8D",
          500: "#E85D75", // Primary warm rose
          600: "#D94A63",
          700: "#B93A52",
          800: "#9A3145",
          900: "#812C3D",
        },

        // Accent teal (fresh, calming)
        accent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6", // Primary accent teal
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },

        // Secondary warm amber
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        // Semantic colors
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          600: "#16A34A",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
        },

        // Dark mode backgrounds - warmer tones
        void: "#0A0908",
        space: "#0F0D0C",
        nebula: "#1A1716",
        cosmic: "#242120",

        // Light mode backgrounds - warm cream
        surface: {
          50: "#FFFCFA",
          100: "#FFFFFF",
          200: "#F8F5F2",
          300: "#F0ECE8",
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
        "glow-coral": "0 0 24px rgba(232, 93, 117, 0.3), 0 0 8px rgba(232, 93, 117, 0.18)",
        "glow-coral-lg": "0 0 40px rgba(232, 93, 117, 0.4), 0 0 16px rgba(232, 93, 117, 0.25)",
        "glow-teal": "0 0 24px rgba(13, 148, 136, 0.3), 0 0 8px rgba(13, 148, 136, 0.18)",
        "glow-teal-lg": "0 0 40px rgba(13, 148, 136, 0.4), 0 0 16px rgba(13, 148, 136, 0.25)",
        "glow-amber": "0 0 24px rgba(217, 119, 6, 0.3), 0 0 8px rgba(217, 119, 6, 0.18)",
        "glow-soft": "0 0 20px currentColor",
        "glass": "0 8px 32px rgba(26, 22, 20, 0.08), 0 4px 16px rgba(26, 22, 20, 0.06)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.45), 0 4px 16px rgba(0, 0, 0, 0.35)",
        "elevated": "0 4px 20px rgba(26, 22, 20, 0.07), 0 2px 8px rgba(26, 22, 20, 0.05)",
        "elevated-dark": "0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)",
        "refined": "0 2px 10px rgba(26, 22, 20, 0.05), 0 1px 4px rgba(26, 22, 20, 0.04)",
        "refined-lg": "0 12px 36px rgba(26, 22, 20, 0.08), 0 4px 14px rgba(26, 22, 20, 0.06)",
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
