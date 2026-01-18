---
description: Run CI pipeline locally before pushing
---

// turbo

# /run-ci - Local CI Runner

Run full CI pipeline locally to catch issues before push.

## Usage

```
/run-ci
/run-ci --fast
```

## Claude Prompt Template

```
Local CI workflow:

1. Activate Environment:
   - Python: source venv/bin/activate
   - Node: nvm use

2. Install Dependencies:
   - pip install -r requirements.txt
   - npm install / pnpm install

3. Run Checks (parallel where possible):
   - Lint: ruff check . && eslint .
   - Type: mypy . && tsc --noEmit
   - Test: pytest && npm test
   - Security: safety check && npm audit

4. Build:
   - Python: python -m build
   - Frontend: npm run build

5. Report Results:
   - Pass/fail for each step
   - Time taken
   - Errors to fix

If --fast: skip install, only lint+test.
```

## Example Output

```
🔄 Running Local CI

Step 1: Lint
   ✅ Ruff: 0 errors
   ✅ ESLint: 0 errors (2 warnings)

Step 2: Type Check
   ✅ mypy: No issues
   ✅ tsc: No issues

Step 3: Tests
   ✅ pytest: 168/168 passed
   ✅ jest: 45/45 passed

Step 4: Build
   ✅ Backend: OK
   ✅ Frontend: OK (1.2MB)

⏱️ Total: 2m 34s
✅ CI would PASS - safe to push!
```
