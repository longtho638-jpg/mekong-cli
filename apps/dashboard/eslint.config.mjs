import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

export default [
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...js.configs.recommended.languageOptions?.globals,
                React: 'readonly',
                JSX: 'readonly',
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                URL: 'readonly',
                // Node globals
                process: 'readonly',
                module: 'readonly',
                require: 'readonly',
                __dirname: 'readonly',
                crypto: 'readonly',
                setInterval: 'readonly',
                setTimeout: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                Blob: 'readonly',
                Buffer: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                Headers: 'readonly',
                WebSocket: 'readonly',
                AudioContext: 'readonly',
                OscillatorType: 'readonly',
                URLSearchParams: 'readonly',
                RequestInit: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLButtonElement: 'readonly',
                HTMLDivElement: 'readonly',
                HTMLHeadingElement: 'readonly',
                HTMLParagraphElement: 'readonly',
                Event: 'readonly',
                KeyboardEvent: 'readonly',
                NodeJS: 'readonly',
                alert: 'readonly',
                sessionStorage: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@next/next': nextPlugin,
        },
        rules: {
            // TypeScript strictness (RELAXED for Migration)
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/prefer-as-const': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/consistent-type-imports': 'warn',

            // React rules
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Next.js rules
            '@next/next/no-html-link-for-pages': 'warn',

            // General code quality (RELAXED)
            'no-unused-vars': 'off', // Use TypeScript rule instead
            'no-useless-escape': 'warn',
            'no-case-declarations': 'warn',
            'no-control-regex': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'eqeqeq': ['warn', 'smart'],
            'prefer-const': 'warn',
            'no-var': 'warn',
            'no-duplicate-imports': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                module: 'readonly',
                exports: 'readonly',
                require: 'readonly',
            }
        }
    },
    {
        ignores: [
            'node_modules/',
            '.next/',
            'out/',
            'dist/',
            '*.config.mjs',
            'scripts/**/*',
            '**/seed.mjs',
        ],
    },
    {
        rules: {
            'no-unused-vars': 'off',
        }
    }
]
