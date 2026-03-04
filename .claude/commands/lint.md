---
description: 🔍 Lint Code — ESLint, Prettier, Code Quality Checks
argument-hint: [--fix] [--quiet] [files...]
---

**Think harder** để lint code: <files>$ARGUMENTS</files>

**IMPORTANT:** Code PHẢI pass lint trước khi commit — không warnings/errors.

## ESLint Commands

```bash
# === Run Lint ===
npm run lint

# === Auto-fix ===
npm run lint -- --fix

# === Lint Specific Files ===
npx eslint src/components/Button.tsx src/utils/index.ts

# === Lint Folder ===
npx eslint src/components/

# === Quiet Mode (errors only) ===
npx eslint --quiet src/

# === Output JSON ===
npx eslint --format=json src/ > lint-results.json

# === Watch Mode ===
npx eslint --watch src/
```

## Prettier Commands

```bash
# === Check Formatting ===
npx prettier --check "src/**/*.{ts,tsx,js,jsx}"

# === Format Files ===
npx prettier --write "src/**/*.{ts,tsx,js,jsx}"

# === Format Specific Files ===
npx prettier --write src/components/Button.tsx

# === Check Without Writing ===
npx prettier --check src/

# === Ignore Path ===
npx prettier --ignore-path .gitignore --write src/
```

## ESLint Config

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'simple-import-sort'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## Prettier Config

```javascript
// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.js',
};
```

## CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run ESLint
      run: npm run lint

    - name: Run Prettier check
      run: npx prettier --check "src/**/*.{ts,tsx,js,jsx}"
```

## Related Commands

- `/test` — Unit & integration tests
- `/type-check` — TypeScript type check
- `/review` — Code quality review
- `/format` — Format codebase
