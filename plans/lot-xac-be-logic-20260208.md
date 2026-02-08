# 🔥 LỘT XÁC BE LOGIC — Master Plan

> Binh Pháp Full Fleet | 2026-02-08 07:37

## /insight Summary

### T1 — mekong-cli (Python Core Engine)

- 18 Python files in src/
- 2 TODO: orchestrator.py L247 (rollback logic), verifier.py L305 (custom checks)
- 11 files with bare `except Exception` + `pass` — swallowing errors
- 5 agents: git_agent, file_agent, content_writer, lead_hunter, recipe_crawler
- 5 tests exist but agents are mostly stubs
- **Lột Xác**: Implement rollback, custom checks, proper error handling, upgrade agents to real

### T2 — agencyos-landing (Next.js)

- 2 API routes: checkout, webhooks/polar
- master/main diverged — needs branch unification
- **Lột Xác**: Error handling in API routes, rate limiting, input validation, branch fix

### T3 — sophia-ai-factory (Next.js)

- 21 API routes (huge BE surface)
- 6 `:any` types remaining (airtable, inngest, tests)
- 2 TODOs (text-to-speech, check-access)
- 23 test files — strong coverage
- **Lột Xác**: Fix remaining `:any`, implement TODOs, error handling audit, API hardening

### T4 — 84tea (Next.js)

- 4 API routes: orders, products, payment/create-link, payment/webhook
- 1 console.log in hub/events.ts
- ~10 files with catch(error) — need proper error types
- 3 TODOs in contact, franchise, club content
- Only 1 test file — CRITICAL gap
- **Lột Xác**: Error handling, type safety, add API route tests, remove console

### T5 — Well (Vite/React SPA)

- 0 TODOs ✅
- 47 files with catch(error) — massive error handling surface
- 0 :any ✅
- 284 tests ✅
- Heavy service layer: 15+ services, 8+ hooks, 7 custom agents
- **Lột Xác**: Error handling standardization, service resilience, retry patterns

## Deployment: Wave 1 (T1 + T3 + T4), then Wave 2 (T2 + T5)
