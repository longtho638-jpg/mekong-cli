# 🐛 Plan: Fix Vercel Deployment & CI/CD

> **Goal:** Identify why Vercel deployment is failing, fix the issues, and ensure a smooth CI/CD pipeline.

## 1. Diagnosis (Phân Tích)

*   **Hypothesis 1 (Project Root):** Vercel might be confused about the root directory (Monorepo with `apps/dashboard`, `apps/docs`, `mekong-cli`).
*   **Hypothesis 2 (Build Command):** The build command in `vercel.json` or Vercel settings might be incorrect for the Next.js app in `apps/dashboard`.
*   **Hypothesis 3 (Dependencies):** Missing dependencies or lockfile issues (pnpm vs npm).
*   **Hypothesis 4 (Environment):** Missing environment variables during build.

## 2. Investigation Steps

1.  **Check `vercel.json`:** Verify routing and build settings.
2.  **Check `package.json` (Root & Apps):** Verify workspaces and scripts.
3.  **Simulate Build:** Run the build command locally from the root to mimic Vercel.
4.  **Check Lockfiles:** Ensure consistent lockfiles.

## 3. Fix Strategy (Chiến Thuật)

*   **If Monorepo Issue:** Create/Update `vercel.json` to explicitly define the project settings for `apps/dashboard`.
*   **If Build Fail:** Fix TypeScript errors or missing deps (already fixed some in previous turns, but need to be sure).
*   **Action:** Explicitly set the "Root Directory" for the Vercel project to `apps/dashboard` OR configure `vercel.json` to handle the monorepo structure. Since this is likely a monorepo, Vercel needs to know *which* app to deploy.

## 4. Execution Plan

1.  **Inspect Configs:** Read `vercel.json`, `package.json`, `pnpm-workspace.yaml`.
2.  **Local Build Test:** Try to build `apps/dashboard` from root.
3.  **Refactor `vercel.json`:** Optimize for monorepo deployment.
4.  **Create Github Workflow (CI):** Ensure we catch errors before Vercel tries to deploy.

## 5. Output Artifacts

*   Updated `vercel.json`.
*   `.github/workflows/ci.yml`.
*   Build verification log.
