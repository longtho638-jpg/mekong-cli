import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isCloudDeploy = process.env.CF_PAGES === '1' || process.env.VERCEL === '1';

export default defineConfig({
  plugins: [react()],
  base: isCloudDeploy ? '/' : '/dashboard/',
  build: {
    outDir: isCloudDeploy ? 'dist' : '../dist/dashboard',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': { target: 'ws://localhost:3000', ws: true },
    },
  },
});
