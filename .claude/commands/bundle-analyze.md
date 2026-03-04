---
description: 📊 Bundle Analyzer — Webpack/Vite Bundle Size, Tree Shaking, Code Splitting
argument-hint: [--mode=production] [--analyzer=webpack|rollup|vite]
---

**Think harder** để bundle analyze: <$ARGUMENTS>

**IMPORTANT:** Bundle size PHẢI < 500KB gzipped — code splitting enabled.

## Webpack Bundle Analyzer

```bash
# === Install ===
npm install -D webpack-bundle-analyzer

# === Run Analyzer ===
npm run build -- --analyze

# === Static Report ===
npm run build -- --analyze --analyzer-mode=static

# === Server Mode ===
npm run build -- --analyze --analyzer-mode=server
```

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }),
  ],
};
```

## Vite Bundle Visualizer

```bash
# === Install ===
npm install -D rollup-plugin-visualizer

# === Run ===
npm run build -- --visualize
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
};
```

## Bundle Size Limits

```javascript
// bundle-size.config.js
module.exports = {
  limits: {
    maxSize: 500 * 1024,  // 500KB
    gzipSize: 150 * 1024, // 150KB
    brotliSize: 120 * 1024, // 120KB
  },
};
```

## CI/CD Check

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Build and analyze
      run: npm run build -- --analyze

    - name: Check bundle size
      run: |
        SIZE=$(cat dist/bundle-stats.json | jq '.assets[0].size')
        if [ "$SIZE" -gt 512000 ]; then
          echo "❌ Bundle size ${SIZE}B exceeds 500KB"
          exit 1
        fi
        echo "✅ Bundle size ${SIZE}B OK"
```

## Related Commands

- `/test` — Run tests
- `/build` — Build project
- `/perf-audit` — Performance audit
