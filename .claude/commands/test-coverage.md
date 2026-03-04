---
description: 📊 Test Coverage — Istanbul/V8, Coverage Reports, Threshold Enforcement
argument-hint: [test-command] [--threshold=80] [--exclude=**/*.spec.ts]
---

**Think harder** để test coverage: <test-command>$ARGUMENTS</test-command>

**IMPORTANT:** Coverage PHẢI ≥80% — dưới ngưỡng này = FAIL CI/CD.

## Coverage Tools

| Tool | Language | Type | CI Report | Best For |
|------|----------|------|-----------|----------|
| **Istanbul/nyc** | JS/TS | Statement/Branch | ✅ | Node.js, Jest, Mocha |
| **Jest Coverage** | JS/TS | Built-in | ✅ | React, Jest projects |
| **Vitest Coverage** | JS/TS | Vite-native | ✅ | Vite projects |
| **pytest-cov** | Python | Plugin | ✅ | Python projects |
| **V8 Coverage** | JS/TS | Native engine | ✅ | Accurate, fast |

## Jest Coverage

```bash
# === Run Coverage ===
npm test -- --coverage

# === Coverage with Threshold ===
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

# === Coverage Specific Files ===
npm test -- --coverage --collectCoverageFrom='src/**/*.ts'

# === HTML Report ===
npm test -- --coverage --coverageReporters=html

# === Text Summary ===
npm test -- --coverage --coverageReporters=text-summary

# === LCov (for CI) ===
npm test -- --coverage --coverageReporters=lcov

# === All Reports ===
npm test -- --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=lcov
```

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/test/', '/dist/'],
};
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch",
    "test:coverage:ci": "jest --coverage --ci --maxWorkers=2",
    "coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":80}}'",
    "coverage:report": "nyc report --reporter=html --reporter=text"
  }
}
```

## Vitest Coverage

```bash
# === Run Coverage ===
npx vitest run --coverage

# === Coverage with Provider ===
npx vitest run --coverage.provider=v8
npx vitest run --coverage.provider=istanbul

# === Coverage Threshold ===
npx vitest run --coverage --coverage.thresholds.100
npx vitest run --coverage --coverage.thresholds.branches=80
npx vitest run --coverage --coverage.thresholds.functions=80
npx vitest run --coverage --coverage.thresholds.lines=80
npx vitest run --coverage --coverage.thresholds.statements=80
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.types.ts',
        'src/main.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/core/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      100: false, // Set to true to enforce 100%
    },
  },
});
```

## Istanbul/nyc Coverage

```bash
# === Install ===
npm install -D nyc

# === Run with Coverage ===
nyc npm test

# === Coverage Report ===
nyc report

# === HTML Report ===
nyc report --reporter=html

# === Text Summary ===
nyc report --reporter=text-summary

# === Check Coverage ===
nyc report --reporter=text --check-coverage --lines 80 --functions 80 --branches 80

# === Coverage for Specific Command ===
nyc --include='src/**/*.ts' --exclude='**/*.spec.ts' npm test
```

```json
// nyc.config.js
module.exports = {
  all: true,
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: [
    'src/**/*.d.ts',
    'src/**/*.stories.{ts,tsx}',
    'src/**/*.types.ts',
    'src/**/*.spec.ts',
    'src/**/*.test.ts',
    'coverage',
    'dist',
  ],
  reporter: ['text', 'html', 'lcov', 'clover'],
  reportsDirectory: './coverage',
  checkCoverage: true,
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
  'reporter': ['text', 'html', 'lcov'],
  'report-dir': './coverage',
};
```

## pytest Coverage (Python)

```bash
# === Install ===
pip install pytest-cov

# === Run Coverage ===
pytest --cov=src

# === Coverage Report ===
pytest --cov=src --cov-report=html
pytest --cov=src --cov-report=term-missing
pytest --cov=src --cov-report=xml

# === Coverage Threshold ===
pytest --cov=src --cov-fail-under=80

# === Coverage for Tests Only ===
pytest --cov=src --cov-config=.coveragerc

# === Combine Multiple Test Runs ===
pytest --cov=src --cov-append --cov-report=xml
```

```ini
# .coveragerc
[run]
source = src
branch = True
omit =
    */tests/*
    */__pycache__/*
    */site-packages/*
    */.venv/*
    */migrations/*
    */tests/*

[report]
precision = 2
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:
    @abstractmethod

[html]
directory = coverage/html

[xml]
output = coverage/coverage.xml
```

## Coverage Analysis

```bash
# === View Coverage Summary ===
cat coverage/coverage-summary.json | jq .

# === Check Uncovered Files ===
cat coverage/lcov.info | grep -A 1 "DA:" | grep ",0"

# === Find Least Covered Files ===
cat coverage/lcov.info | grep "^SF:" | sort | uniq -c | sort -rn | head -20
```

```typescript
// scripts/coverage-analysis.ts
import { readFileSync } from 'fs';
import { join } from 'path';

const summary = JSON.parse(
  readFileSync(join(__dirname, '../coverage/coverage-summary.json'), 'utf-8')
);

console.log('Coverage Summary:\n');

Object.entries(summary.total.lines.pct).forEach(([file, pct]) => {
  const status = pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';
  console.log(`${status} ${file}: ${pct}%`);
});

const overall = summary.total.lines.pct;
console.log(`\nOverall: ${overall}%`);

if (overall < 80) {
  console.error('\n❌ Coverage below threshold!');
  process.exit(1);
}
```

## Visual Coverage Report

```html
<!-- Open coverage/index.html in browser -->
<!DOCTYPE html>
<html>
<head>
  <title>Coverage Report</title>
</head>
<body>
  <h1>Code Coverage Report</h1>
  <iframe src="coverage/lcov-report/index.html" width="100%" height="600px"></iframe>
</body>
</html>
```

## Coverage Badges

```markdown
<!-- README.md badge -->
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)

<!-- Dynamic badge from coverage.json -->
![Coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/coverage/coverage-summary.json&query=$.total.lines.pct&suffix=%&label=Coverage)
```

```json
// Generate badge
{
  "scripts": {
    "badge": "node scripts/generate-coverage-badge.js"
  }
}
```

```javascript
// scripts/generate-coverage-badge.js
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function generateBadge() {
  const summary = JSON.parse(
    await readFile('coverage/coverage-summary.json', 'utf-8')
  );

  const coverage = summary.total.lines.pct;
  const color = coverage >= 80 ? 'brightgreen' : coverage >= 60 ? 'yellow' : 'red';

  const badge = `https://img.shields.io/badge/coverage-${coverage}%25-${color}`;

  await writeFile('coverage-badge.svg', badge);
  console.log(`Badge generated: ${badge}`);
}

generateBadge();
```

## CI/CD Coverage Enforcement

```yaml
# .github/workflows/coverage.yml
name: Coverage Check

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run tests with coverage
      run: npm run test:coverage

    - name: Check coverage threshold
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        echo "Coverage: ${COVERAGE}%"
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "❌ Coverage ${COVERAGE}% is below 80% threshold"
          exit 1
        fi
        echo "✅ Coverage ${COVERAGE}% meets threshold"

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/lcov.info
        fail_ci_if_error: true

    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      with:
        name: coverage-report
        path: coverage/
```

## Coverage Merge (Multiple Test Suites)

```bash
# === Merge Jest + Vitest Coverage ===
npx nyc merge coverage-jest coverage-vitest coverage/merged

# === Generate Combined Report ===
nyc report --reporter=html --reporter=lcov --report-dir=coverage/merged
```

## Related Commands

- `/test` — Unit & integration tests
- `/test:e2e` — End-to-end tests
- `/test:ui` — UI component tests
- `/review` — Code quality review
- `/health-check` — System health monitoring
