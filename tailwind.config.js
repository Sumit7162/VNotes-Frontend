/** @type {import('tailwindcss').Config} */
export default {
  // Class strategy, not the default "media": the home page pins itself to dark
  // regardless of the visitor's OS setting, and that only works if `dark:`
  // variants follow a class rather than prefers-color-scheme.
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // A cool, near-white ground rather than a tinted gradient. The old page
        // background layered a blue radial over a blue linear gradient, which is
        // what made every screen feel washed; flat surfaces let the accent do
        // the work instead.
        // Surfaces. Driven by CSS variables so the light/dark toggle can swap
        // them without every `bg-paper-50` in the app needing a dark: variant.
        // Channels rather than hex, so the /opacity modifier still works.
        paper: {
          50: "rgb(var(--paper-50) / <alpha-value>)",
          100: "rgb(var(--paper-100) / <alpha-value>)",
          200: "rgb(var(--paper-200) / <alpha-value>)",
          300: "rgb(var(--paper-300) / <alpha-value>)",
        },
        // One cool neutral ramp. The app previously mixed Tailwind's slate and
        // gray scales at random, which reads as unconsidered however good the
        // accent is.
        ink: {
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--ink-900) / <alpha-value>)",
        },
        // Sampled from the logo, whose stroke runs #3040A0 indigo -> #2080C0
        // blue -> #20D0D0 cyan. Used flat and sparingly: one confident blue,
        // never a gradient.
        accent: {
          50: "#EEF4FF",
          100: "#DAE6FE",
          200: "#B9CDFC",
          300: "#8FADF8",
          400: "#6C93F0",
          500: "#4477E4",
          600: "#2A5FD9",
          700: "#1F49AC",
          800: "#1A3A85",
          DEFAULT: "#2A5FD9",
        },
        // The cyan end of the logo gradient, darkened enough to carry text.
        cyan: {
          50: "#E9FAFB",
          100: "#C7F1F4",
          200: "#97E3E9",
          300: "#5FE3EA",
          400: "#22D3D3",
          600: "#0E90A0",
          700: "#0B7280",
          DEFAULT: "#0E90A0",
        },
        // The indigo end, pushed violet so it is distinguishable from `accent`
        // when the two sit side by side in a list of statuses.
        violet: {
          50: "#F1EFFC",
          100: "#DFDAF8",
          200: "#C3BAF1",
          600: "#5B47C4",
          700: "#47379B",
          DEFAULT: "#5B47C4",
        },
        // The one warm hue, kept for the download stage: against a blue system
        // an amber reads instantly as "something is happening".
        gold: {
          50: "#FEF6E7",
          100: "#FCE9C2",
          200: "#F7D593",
          600: "#A9700B",
          700: "#855706",
          DEFAULT: "#A9700B",
        },
        // The dark surfaces for the landing page. 900 is the exact background
        // the KineticMatrix canvas paints, so the panel and the page around it
        // meet with no visible seam.
        night: {
          900: "#06070a",
          800: "#0C0E13",
          700: "#141821",
          600: "#1D222D",
          line: "#232A36",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
        },
        // The application shell. The sidebar is its own surface rather than
        // `paper`, because it sits a step apart from both the page behind it
        // and the cards on it - which is what stops the layout reading as one
        // undifferentiated sheet.
        sidebar: {
          DEFAULT: "rgb(var(--sidebar) / <alpha-value>)",
          line: "rgb(var(--sidebar-line) / <alpha-value>)",
        },
        // shadcn token names, backed by the CSS variables in index.css so
        // pasted components work and follow the .dark class with everything
        // else. `accent` is intentionally not among them - see index.css.
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        success: {
          50: "#ECF7F0",
          100: "#D3EDDD",
          200: "#AEDCC1",
          600: "#1F7A4C",
          700: "#175C39",
          DEFAULT: "#1F7A4C",
        },
        danger: {
          50: "#FDF1F1",
          100: "#FADEDE",
          200: "#F3BFBF",
          600: "#C0362F",
          700: "#9A2A24",
          800: "#7A211C",
          DEFAULT: "#C0362F",
        },
      },
      fontFamily: {
        // Fraunces carries the headings, Inter does the reading. Both are loaded
        // in index.html - the stylesheet used to name Inter while nothing ever
        // fetched it, so every screen silently rendered in system-ui.
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        // Three steps used consistently: controls, cards, pills. The original
        // mixed six radii with no rule behind which went where.
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "14px",
        "3xl": "18px",
      },
      boxShadow: {
        // Two quiet steps, neutral rather than tinted. Coloured shadows under
        // buttons were part of what made the old interface look generated.
        sm: "0 1px 2px rgba(19, 26, 36, 0.05)",
        DEFAULT: "0 1px 3px rgba(19, 26, 36, 0.07)",
        md: "0 2px 8px rgba(19, 26, 36, 0.08)",
        lg: "0 6px 20px rgba(19, 26, 36, 0.10)",
      },
    },
  },
  plugins: [],
}
