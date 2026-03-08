import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Node-based tests: daemon logic using child_process, fs, module
        include: ['test/**/*.{test,spec}.{js,ts}'],
        exclude: [
            '**/node_modules/**', '**/.claude/**', '**/dist/**',
            '**/.git/**', '**/plans/**',
        ],
    },
});
