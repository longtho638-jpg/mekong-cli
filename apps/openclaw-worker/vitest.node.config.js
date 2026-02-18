import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // pool: 'forks', // Commented out to enable proper transformation/mocking
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,ts}'],
    globals: true,
    server: {
      deps: {
        // Inline the project files to ensure they are transformed by Vitest
        // This is critical for mocking CJS requires of built-in modules
        inline: [
          /openclaw-worker/, // Broaden to match any file in this package
        ],
        fallbackCJS: true,
      },
    },
  },
});
