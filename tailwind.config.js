/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "hsl(var(--bg) / <alpha-value>)",
          subtle: "hsl(var(--bg-subtle) / <alpha-value>)",
          elevated: "hsl(var(--bg-elevated) / <alpha-value>)",
          inset: "hsl(var(--bg-inset) / <alpha-value>)",
        },
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          strong: "hsl(var(--border-strong) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "hsl(var(--fg) / <alpha-value>)",
          muted: "hsl(var(--fg-muted) / <alpha-value>)",
          subtle: "hsl(var(--fg-subtle) / <alpha-value>)",
          faint: "hsl(var(--fg-faint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          fg: "hsl(var(--accent-fg) / <alpha-value>)",
          muted: "hsl(var(--accent-muted) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          muted: "hsl(var(--danger-muted) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          muted: "hsl(var(--warning-muted) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          muted: "hsl(var(--success-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 hsl(0 0% 0% / 0.24)",
        elevated:
          "0 0 0 1px hsl(var(--border) / 0.6), 0 8px 24px -8px hsl(0 0% 0% / 0.5)",
        popover:
          "0 0 0 1px hsl(var(--border) / 0.7), 0 12px 40px -12px hsl(0 0% 0% / 0.65)",
      },
      transitionTimingFunction: {
        swift: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slide-up 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
