# 始計 Open Source RaaS AGI Strategy — Cook Report

**Date:** 2026-02-28 | **Mode:** --auto | **Status:** COMPLETE

## Binh Pháp Alignment
**Chapter 1**: 始計 Kế Hoạch — Strategic audit & preparation

## Changes Made (3 files)

### 1. `package.json` — Fix build + Ch.4 軍形
- **REMOVED** `workspaces` field (conflicted with pnpm-workspace.yaml → Turbo "multiple package managers" error)
- **ADDED** `"packageManager": "pnpm@10.26.2"` (explicit declaration)
- Fields already present: `license: MIT`, `repository`, `homepage`, `bugs`

### 2. `apps/openclaw-worker/lib/jules-agent.js` — Ch.1 始計 + Ch.13 用間
- **REMOVED** hardcoded API key: `JULES_API_KEY = 'AQ.Ab8...'`
- **REPLACED** with: `process.env.JULES_API_KEY || ''`
- Critical security fix — credential was exposed in source code

### 3. `.env.example` — Ch.1 始計
- **ADDED** `GEMINI_API_KEY`, `MEKONG_API_TOKEN`, `TELEGRAM_API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `JULES_API_KEY`
- Added header comment for contributors
- Now covers all env vars used across codebase

## Verification

| Chapter | Gate | Status |
|---------|------|--------|
| Ch.1 始計 | Secrets audit | ✅ JULES_API_KEY fixed, .env.example updated |
| Ch.3 謀攻 | README | ✅ Already has Quick Start, Contributing, Architecture |
| Ch.4 軍形 | MIT LICENSE | ✅ Valid MIT license, package.json fields present |
| Ch.6 虛實 | Vulnerabilities | ⚠️ 41 transitive deps (upstream), pnpm overrides applied |
| Ch.13 用間 | Data leaks | ✅ No proprietary secrets in source; hardcoded paths are local-only daemon config |

## Build Status
- Package manager conflict: ✅ FIXED
- Turbo build: 20/33 tasks pass (sub-app failures are pre-existing, unrelated)
- Core packages: all build successfully

## Unresolved
- 41 npm audit vulnerabilities (all transitive, need upstream fixes)
- `apps/com-anh-duong-10x` build fails (CSS syntax error — separate issue)
- Hardcoded `/Users/macbookprom1` paths in openclaw-worker (local daemon, not a secret leak but should use config.js dynamic resolution for portability)
