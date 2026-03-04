---
description: 📦 Dependencies Audit — npm audit, outdated deps, security vulnerabilities
argument-hint: [--fix] [--production] [--severity=high]
---

**Think harder** để deps audit: <$ARGUMENTS>

**IMPORTANT:** Dependencies PHẢI không có high/critical vulnerabilities — audit regular weekly.

## npm audit

```bash
# === Run Audit ===
npm audit

# === Auto-fix ===
npm audit fix

# === Force Fix (breaking changes) ===
npm audit fix --force

# === High Severity Only ===
npm audit --audit-level=high

# === Production Deps Only ===
npm audit --production

# === JSON Output ===
npm audit --json > audit-results.json

# === Specific Package ===
npm audit lodash
```

## Check Outdated

```bash
# === List Outdated ===
npm outdated

# === Update All ===
npm update

# === Update Specific ===
npm update lodash react

# === Major Updates ===
npx npm-check-updates -u

# === Minor/Patch Only ===
npx npm-check-updates -u -t minor
```

## ncu (npm-check-updates)

```bash
# === Install ===
npm install -g npm-check-updates

# === Check Updates ===
ncu

# === Update package.json ===
ncu -u

# === Minor/Patch Only ===
ncu -u -t minor

# === Remove Deprecations ===
ncu -u --deprecated false
```

## CI/CD Integration

```yaml
# .github/workflows/deps-audit.yml
name: Dependencies Audit

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run npm audit
      run: npm audit --audit-level=high

    - name: Check outdated
      run: npm outdated
      continue-on-error: true
```

## Related Commands

- `/security-audit` — Security audit
- `/test` — Run tests
- `/build` — Build project
