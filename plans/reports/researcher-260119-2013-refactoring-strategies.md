# Refactoring Strategies & Performance Optimization Research

**Date**: 2026-01-19
**Scope**: 1-3 day go-live readiness
**Priority**: Low-risk, high-impact patterns

---

## 1. Top 5 Refactoring Patterns for Monolithic Files

### Pattern 1: Extract Domain Services (Highest Impact)
**Target**: api.ts (1,391 lines)
```
Before: api.ts (everything)
After:
  - api/client.ts (base client, interceptors)
  - api/auth-service.ts (auth endpoints)
  - api/tasks-service.ts (task endpoints)
  - api/projects-service.ts (project endpoints)
  - api/types.ts (shared types)
```
**Time**: 2-4 hours | **Risk**: Low (exports remain same)

### Pattern 2: Component Splitting via Composition
**Target**: ProjectTasks.tsx (1,103 lines)
```
Before: ProjectTasks.tsx (monolith)
After:
  - ProjectTasks/index.tsx (container, 100 lines)
  - ProjectTasks/TaskList.tsx (list rendering)
  - ProjectTasks/TaskFilters.tsx (filtering UI)
  - ProjectTasks/TaskItem.tsx (single task)
  - ProjectTasks/hooks/useTaskFilters.ts
  - ProjectTasks/types.ts
```
**Time**: 3-6 hours | **Risk**: Medium (requires testing)

### Pattern 3: Hook Extraction (Quick Wins)
**Identify**: Repeated useState/useEffect blocks
```typescript
// Before: inline in component
const [data, setData] = useState()
useEffect(() => fetchData(), [])

// After: extract to hook
const { data, loading, error } = useFetchData(url)
```
**Time**: 30min per hook | **Risk**: Low

### Pattern 4: Utility Pure Functions
**Extract**: Non-UI logic to utils/
```
- utils/date-formatters.ts
- utils/validators.ts
- utils/transformers.ts
```
**Time**: 1-2 hours | **Risk**: Very Low (pure functions)

### Pattern 5: Barrel Exports for Clean Imports
**After splitting**, add index.ts per folder:
```typescript
// api/index.ts
export * from './auth-service'
export * from './tasks-service'
export { apiClient } from './client'
```
**Time**: 15min per module | **Risk**: None

---

## 2. Performance Optimization Checklist (Prioritized)

### P0: Critical (Must-Do, 1 day)
- [ ] **Code Splitting**: Route-based lazy loading
  ```typescript
  const ProjectTasks = lazy(() => import('./ProjectTasks'))
  ```
  **Impact**: -30% initial bundle | **Time**: 2 hours

- [ ] **Tree Shaking**: Check side-effect-free modules
  ```json
  // package.json
  "sideEffects": ["*.css", "polyfills.ts"]
  ```
  **Impact**: -10-15% bundle | **Time**: 1 hour

- [ ] **Production Build Analysis**
  ```bash
  pnpm build && pnpm analyze
  ```
  Use `webpack-bundle-analyzer` or `rollup-plugin-visualizer`
  **Time**: 30min setup

### P1: High Impact (Should-Do, 2 days)
- [ ] **Memoization Strategy**
  ```typescript
  // Heavy computation components
  export default memo(ExpensiveComponent, arePropsEqual)

  // Expensive calculations
  const result = useMemo(() => compute(data), [data])

  // Callbacks to children
  const handler = useCallback(() => {}, [deps])
  ```
  **Impact**: -40% re-renders | **Time**: 4 hours

- [ ] **Dynamic Imports for Heavy Libs**
  ```typescript
  // Bad: import moment from 'moment' (288KB)
  // Good: use date-fns with tree-shaking (10KB)
  import { format } from 'date-fns'
  ```
  **Impact**: -200KB+ | **Time**: 2 hours

- [ ] **Image Optimization**
  - WebP format with fallbacks
  - Lazy load below-fold images
  - Use `loading="lazy"` attribute
  **Impact**: -50% image bandwidth | **Time**: 1 hour

### P2: Nice-to-Have (3 days)
- [ ] API Response Caching (React Query / SWR)
- [ ] Virtual scrolling for long lists (react-window)
- [ ] Service Worker for static assets

---

## 3. Testing Strategy for Safe Refactoring

### Phase 1: Pre-Refactor Baseline (2 hours)
```bash
# 1. Snapshot current behavior
pnpm test -- --coverage --json --outputFile=baseline.json

# 2. E2E critical paths
npx playwright test --grep="@critical"

# 3. Lighthouse baseline
npx lighthouse https://yourapp.com --output=json
```

### Phase 2: Refactor with TDD (per module)
```typescript
// 1. Write characterization tests (existing behavior)
describe('api/auth-service (legacy behavior)', () => {
  it('should match old api.ts login behavior', () => {
    // Prevent regressions
  })
})

// 2. Refactor implementation
// 3. Tests should still pass (green)
```

### Phase 3: Regression Prevention
- **Visual Regression**: Chromatic / Percy (if budget allows)
- **API Contract Testing**: Pact / MSW mocks
- **Type Safety**: Enable `strict: true` in tsconfig.json
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true
    }
  }
  ```

### Coverage Target: >80%
```bash
# Enforce in CI
pnpm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```

---

## 4. Backward Compatibility Strategies

### Strategy A: Facade Pattern (Low Risk, 1-2 hours)
**Use for**: API clients refactoring
```typescript
// Old monolithic api.ts
export { login, getTasks } from './legacy-api'

// After refactoring, keep exports
// api/index.ts
export { login } from './auth-service' // re-export
export { getTasks } from './tasks-service'
```
**Result**: Consumer code unchanged

### Strategy B: Deprecation with TypeScript
```typescript
/**
 * @deprecated Use `useTaskFilters` hook instead
 * Will be removed in v2.0
 */
export const oldFilterFunction = () => { ... }
```

### Strategy C: Feature Flags (3 hours setup)
```typescript
// For risky UI refactors
const NewProjectTasks = lazy(() => import('./ProjectTasks-v2'))
const OldProjectTasks = lazy(() => import('./ProjectTasks'))

export default featureFlags.newTasksUI ? NewProjectTasks : OldProjectTasks
```

### Strategy D: API Versioning (Not Recommended for 1-3 days)
- Adds complexity
- Use only if breaking backend changes

---

## 5. Automation & Tooling Recommendations

### Tier 1: Essential (Setup: 1 hour total)
| Tool | Purpose | Setup Time | Command |
|------|---------|-----------|---------|
| **ESLint** | Catch patterns | 15min | `pnpm add -D @typescript-eslint/parser` |
| **Prettier** | Consistent format | 10min | `pnpm add -D prettier` |
| **TypeScript Strict** | Type safety | 30min | Set `strict: true` in tsconfig |
| **Bundle Analyzer** | Size tracking | 15min | `pnpm add -D rollup-plugin-visualizer` |

### Tier 2: High-Value (Setup: 2-3 hours)
| Tool | Purpose | Setup Time | Notes |
|------|---------|-----------|-------|
| **ts-morph** | AST refactoring | 1 hour | Automate repetitive transforms |
| **jscodeshift** | Codemods | 1 hour | Facebook's codemod toolkit |
| **Lighthouse CI** | Perf monitoring | 1 hour | Catches regressions in CI |

### Sample ESLint Rules for Refactoring
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'max-lines': ['warn', { max: 300, skipBlankLines: true }],
    'max-lines-per-function': ['warn', 50],
    'complexity': ['warn', 10],
    'import/no-cycle': 'error', // Catch circular deps
  }
}
```

### Sample Codemod (ts-morph) - Extract Service
```typescript
// scripts/refactor-extract-service.ts
import { Project } from 'ts-morph'

const project = new Project()
const sourceFile = project.addSourceFileAtPath('api.ts')

// Find all functions matching pattern
const authFunctions = sourceFile.getFunctions()
  .filter(f => f.getName()?.startsWith('auth'))

// Create new file
const newFile = project.createSourceFile('api/auth-service.ts')
authFunctions.forEach(f => {
  newFile.addFunction(f.getStructure())
  f.remove()
})

project.save()
```
**Time to implement**: 2 hours | **Saves**: 10+ hours manual work

---

## Immediate Action Plan (1-3 Days)

### Day 1: Foundation (6 hours)
1. Setup bundle analyzer, baseline metrics (1h)
2. Enable TypeScript strict mode, fix errors (2h)
3. Add ESLint max-lines rules (30min)
4. Extract 3-5 pure utility functions (2h)
5. Write characterization tests for critical paths (30min)

### Day 2: Core Refactoring (8 hours)
1. Extract api.ts services with facade pattern (4h)
2. Code-split 2-3 heavy routes (2h)
3. Replace heavy libraries (moment → date-fns) (1h)
4. Add memoization to top 3 re-rendering components (1h)

### Day 3: Validation (4 hours)
1. Run full test suite + coverage check (1h)
2. Lighthouse CI comparison (30min)
3. Bundle size validation (target: <1MB) (30min)
4. Manual QA critical paths (2h)

**Total Effort**: 18 hours over 3 days
**Expected Bundle Reduction**: 30-40%
**Risk Level**: Low (backward compatible)

---

## Unresolved Questions
1. Current test coverage percentage? (Affects refactor risk)
2. Are there E2E tests in place? (Regression safety)
3. Is there a staging environment? (Safe testing ground)
4. Bundle analyzer already configured? (Baseline metrics)
5. Feature flag system exists? (Gradual rollout option)
