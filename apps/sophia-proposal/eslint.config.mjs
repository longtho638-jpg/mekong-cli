import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore .claude directory (hooks, skills, config)
    ".claude/**",
    // Ignore test files in .claude
    "**/__tests__/**",
    // Ignore node_modules and virtual environments
    "**/node_modules/**",
    "**/.venv/**",
    // Ignore coverage and reports
    "coverage/**",
    "reports/**",
    "**/*.min.js",
    // Ignore agi-sops python venv
    "agi-sops/.venv/**",
    "agi-sops/**/node_modules/**",
  ]),
  // Allow setState in useEffect for initial auth state (legitimate use case)
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
