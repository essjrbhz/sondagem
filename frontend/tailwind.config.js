/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Geothra Brand Colors ──────────────────────────────
        // Pantone 547 C — Teal escuro (cor principal da marca)
        primary: {
          DEFAULT: "#003440",
          50:  "#e6eef0",
          100: "#b3ccd2",
          200: "#80aab4",
          300: "#4d8896",
          400: "#1a6678",
          500: "#003440",
          600: "#002e38",
          700: "#002830",
          800: "#001f25",
          900: "#00161b",
        },
        // Pantone 610 C — Amarelo (highlight / accent)
        accent: {
          DEFAULT: "#E6D352",
          light:   "#f0e47a",
          dark:    "#c9b830",
        },
        // Pantone 457 C — Ouro (secundário)
        gold: {
          DEFAULT: "#B29312",
          dark:    "#876F08",
        },
        // ── Status dos Furos ─────────────────────────────────
        status: {
          pendente:  "#E6D352",
          execucao:  "#2563EB",
          concluido: "#16A34A",
          cancelado: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 52, 64, 0.10)",
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%':      { transform: 'translateX(-6px)' },
          '30%':      { transform: 'translateX(6px)' },
          '45%':      { transform: 'translateX(-4px)' },
          '60%':      { transform: 'translateX(4px)' },
          '75%':      { transform: 'translateX(-2px)' },
          '90%':      { transform: 'translateX(2px)' },
        },
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}

