import type { Config } from "tailwindcss";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const animate = require("tailwindcss-animate");

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── New Brand palette ───────────────────────────────────────
        background: "#FFFFFF",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#0D6980",
          50:  "#E6F4F7",
          100: "#CCE9EF",
          200: "#99D3DF",
          300: "#66BDCF",
          400: "#33A7BF",
          500: "#0D6980",
          600: "#0A5466",
          700: "#083F4D",
          800: "#052A33",
          900: "#03151A",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          50:  "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
        },
        text: {
          DEFAULT: "#000000",
          muted:   "#666666",
          light:   "#999999",
        },
        muted: "#666666",
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          teal: "#0D6980",
        },
        // ─── Mood colours ─────────────────────────────────────────────────
        mood: {
          critical: "#EF4444",
          low:      "#F59E0B",
          okay:     "#10B981",
          good:     "#3B82F6",
          excellent:"#8B5CF6",
        },
        // ─── Radix / shadcn semantic tokens ───────────────────────────────
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        foreground:  "hsl(var(--foreground))",
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },

      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "16px",
        "2xl":"20px",
        "3xl":"24px",
      },

      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover":"0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        soft:       "0 2px 8px rgba(0,0,0,0.06)",
        medium:     "0 4px 20px rgba(0,0,0,0.08)",
        large:      "0 8px 40px rgba(0,0,0,0.10)",
      },

      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in":   "scaleIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer:      "shimmer 1.5s infinite",
        float:        "float 3s ease-in-out infinite",
        "spin-slow":  "spin 3s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        slideDown: {
          "0%":   { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)",      opacity: "1" },
        },
        scaleIn: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)"  },
          "50%":      { transform: "translateY(-8px)" },
        },
      },

      spacing: {
        "18":  "4.5rem",
        "88":  "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [animate],
};

export default config;
