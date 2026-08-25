import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // ── CACI Brand Tokens ─────────────────────────────────────────
        // Values defined in globals.css @theme / :root — edit there only.
        "caci-red":        "var(--color-caci-red)",
        "caci-red-light":  "var(--color-caci-red-light)",
        "caci-red-dim":    "var(--color-caci-red-dim)",
        "caci-red-bg":     "var(--color-caci-red-bg)",
        "caci-blue":       "var(--color-caci-blue)",
        "caci-blue-light": "var(--color-caci-blue-light)",
        "caci-blue-dim":   "var(--color-caci-blue-dim)",
        "caci-blue-bg":    "var(--color-caci-blue-bg)",

        // Neutral scale
        n50:  "var(--color-n50)",
        n100: "var(--color-n100)",
        n200: "var(--color-n200)",
        n300: "var(--color-n300)",
        n400: "var(--color-n400)",
        n500: "var(--color-n500)",
        n700: "var(--color-n700)",
        n900: "var(--color-n900)",

        // Semantic status
        success:       "var(--color-success)",
        "success-bg":  "var(--color-success-bg)",
        warning:       "var(--color-warning)",
        "warning-bg":  "var(--color-warning-bg)",

        // ── Surface tokens (THE global theme knobs) ───────────────────
        // Defined as CSS custom properties in globals.css :root + .dark.
        // Changing those 6 vars repaints the entire app — no component
        // files need touching.
        "surface-page":     "var(--surface-page)",
        "surface-card":     "var(--surface-card)",
        "surface-card-alt": "var(--surface-card-alt)",
        "surface-input":    "var(--surface-input)",
        "surface-overlay":  "var(--surface-overlay)",
        "surface-nav":      "var(--surface-nav)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
