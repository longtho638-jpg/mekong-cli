import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        'deep-space': {
          950: '#020010',
          900: '#030014',
          800: '#0a0a1f',
          700: '#11112e',
          600: '#1a1a3e',
        },
        nebula: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        starlight: {
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
        },
        'primary-cyan': '#00F5FF',
        amethyst: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        glass: {
          50: "rgba(255, 255, 255, 0.05)",
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.15)",
          300: "rgba(255, 255, 255, 0.2)",
        },
        glow: {
          purple: "rgba(168, 85, 247, 0.4)",
          blue: "rgba(59, 130, 246, 0.4)",
          cyan: "rgba(6, 182, 212, 0.4)",
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'magnetic': 'magnetic 0.3s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', boxShadow: '0 0 20px var(--glow-color)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px var(--glow-color)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'magnetic': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(var(--x), var(--y))' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
