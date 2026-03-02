import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0F0F1A', card: '#1A1A2E', border: '#2D3142' },
        accent: '#00D9FF',
        profit: '#00FF41',
        loss: '#FF3366',
        muted: '#8892B0',
      },
      fontFamily: {
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
