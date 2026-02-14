import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['data/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}', 'components/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.next/**', '_backup/**', '.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
