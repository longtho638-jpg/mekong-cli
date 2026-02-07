/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "background-secondary": "var(--background-secondary)",
        "neon-cyan": "var(--neon-cyan)",
        "neon-purple": "var(--neon-purple)",
        "neon-pink": "var(--neon-pink)",
      },
      backgroundImage: {
        "gradient-space": "var(--gradient-space)",
        "gradient-neon": "var(--gradient-neon)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
}
