# 🐛 Plan: CI/CD Technical Debt Elimination

> **Goal:** Eliminate technical debt in the GitHub Actions pipeline by ensuring full coverage (Frontend + Backend), optimizing performance, and standardizing workflows.

## 1. Diagnosis (Phân Tích Nợ Kỹ Thuật)

| Debt Item | Severity | Impact |
| :--- | :--- | :--- |
| **Missing Backend Tests** | 🔴 High | Python code (Core/CLI) is not tested in CI. Bugs can merge easily. |
| **Manual Monorepo Handling** | 🟡 Medium | `cd apps/dashboard` is brittle. Should use `turbo` to build/lint all apps. |
| **Missing Frontend Tests** | 🔴 High | No `test` script running for frontend. |
| **Missing Formatting Check** | 🔵 Low | No check for Prettier compliance. |
| **Duplicated Setup** | 🔵 Low | `setup-node` and `pnpm` setup could be optimized. |

## 2. Refactoring Strategy (Chiến Thuật)

### A. Unify CI Workflow (`ci.yml`)
Instead of just "Build Dashboard", we will have two parallel jobs or one comprehensive job:

1.  **Job 1: Backend (Python)**
    *   Setup Python 3.9+.
    *   Install dependencies (`requirements.txt`).
    *   Run `pytest` (Unit Tests).
    *   Run `ruff` (Linting).

2.  **Job 2: Frontend (Node.js/Turbo)**
    *   Setup Node 20 + pnpm.
    *   Install dependencies.
    *   Run `turbo run build lint test` (Builds, Lints, and Tests everything).

### B. Optimization
*   **Caching:** Ensure `pnpm` store and `pip` cache are active.
*   **Fail Fast:** Fail early if linting fails.

## 3. Execution Steps

1.  **Update `package.json`:** Ensure root scripts are solid.
2.  **Refactor `ci.yml`:** Rewrite to include Backend and Frontend jobs.
3.  **Add `ruff`:** Ensure Python linting is enforceable.
4.  **Verify:** Run commands locally to ensure they pass.

## 4. Output Artifacts

*   `.github/workflows/ci.yml` (Complete rewrite)
