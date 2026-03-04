---
description: 🔎 Type Check — TypeScript Strict Mode, Type Safety, No `any`
argument-hint: [--strict] [--noEmit] [--watch]
---

**Think harder** để type check: <$ARGUMENTS>

**IMPORTANT:** Type safety PHẢI 100% — không `any`, không `@ts-ignore`, strict mode enabled.

## TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedSideEffectImports": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## Type Check Commands

```bash
# === Basic Type Check ===
npx tsc --noEmit

# === Strict Mode ===
npx tsc --noEmit --strict

# === Watch Mode ===
npx tsc --noEmit --watch

# === Generate tsconfig ===
npx tsc --init

# === Find any types ===
grep -r ": any" src --include="*.ts" --include="*.tsx"

# === Find ts-ignore ===
grep -r "@ts-ignore\|@ts-expect-error" src --include="*.ts" --include="*.tsx"

# === Find implicit any ===
npx tsc --noEmit --strict --noImplicitAny

# === Project References ===
npx tsc --build --verbose
```

## Strict Type Safety Rules

```typescript
// ❌ BANNED: any type
const data: any = getData();

// ✅ FIXED: Proper type
interface Data {
  id: string;
  name: string;
}
const data: Data = getData();

// ❌ BANNED: @ts-ignore without justification
// @ts-ignore
const result = riskyFunction();

// ✅ FIXED: @ts-expect-error with explanation
// @ts-expect-error - API returns undefined for empty results (see ticket #123)
const result = riskyFunction();

// ❌ BANNED: Type assertion without validation
const element = document.getElementById('my-id') as HTMLElement;

// ✅ FIXED: Null check first
const element = document.getElementById('my-id');
if (element) {
  // Use element safely
}

// ❌ BANNED: Indexed access without check
const value = obj[key];  // Could be undefined

// ✅ FIXED: With null coalescing
const value = obj[key] ?? defaultValue;

// ✅ OR: Type guard
function hasKey<T extends object>(obj: T, key: keyof T): boolean {
  return key in obj;
}
if (hasKey(obj, key)) {
  const value = obj[key];  // Properly narrowed type
}
```

## Type Utilities

```typescript
// src/types/utils.ts

// Make all properties required AND non-nullable
export type StrictRequired<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// Deep partial
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Deep required
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Make specific properties required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Exclude null and undefined
export type NonNullable<T> = T extends null | undefined ? never : T;

// Extract return type
export type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

// Extract parameter types
export type Parameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

// Utility type for API responses
export type ApiResponse<T> = {
  data: T;
  error?: string;
  status: number;
};

// Utility type for form state
export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
};
```

## Type Guard Functions

```typescript
// src/types/guards.ts

// String check
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Number check
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Array check
export function isArray<T>(value: unknown, guard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (guard) return value.every(guard);
  return true;
}

// Object check
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Nullable check
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// API Response check
interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export function isApiResponse<T>(
  response: unknown,
  guard: (data: unknown) => data is T
): response is ApiResponse<T> {
  if (!isObject(response)) return false;
  if (!isNumber(response.status)) return false;
  if (response.error !== undefined && !isString(response.error)) return false;
  if (!guard((response as ApiResponse<T>).data)) return false;
  return true;
}
```

## ESLint Type Rules

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
        minimumDescriptionLength: 10,
      },
    ],
  },
};
```

## CI/CD Type Check

```yaml
# .github/workflows/type-check.yml
name: Type Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run type check
      run: npx tsc --noEmit

    - name: Check for any types
      run: |
        COUNT=$(grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l || true)
        if [ "$COUNT" -gt 0 ]; then
          echo "❌ Found $COUNT 'any' types in codebase"
          grep -r ": any" src --include="*.ts" --include="*.tsx"
          exit 1
        fi
        echo "✅ No 'any' types found"

    - name: Check for ts-ignore
      run: |
        COUNT=$(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l || true)
        if [ "$COUNT" -gt 0 ]; then
          echo "⚠️ Found $COUNT '@ts-ignore' directives"
          echo "Use '@ts-expect-error' with explanation instead"
        fi
```

## Related Commands

- `/test` — Unit & integration tests
- `/lint` — Lint codebase
- `/review` — Code quality review
- `/build` — Build project
