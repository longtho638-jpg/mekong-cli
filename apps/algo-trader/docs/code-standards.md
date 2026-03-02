# Code Standards — Algo Trader v3.0.0

## General Principles
- **YAGNI**: Chỉ cài đặt những gì thực sự cần thiết
- **KISS**: Giữ mã nguồn đơn giản và dễ hiểu
- **DRY**: Tránh lặp lại, dùng utility functions hoặc abstract classes

## TypeScript Standards
- **Strict Mode**: Luôn bật trong `tsconfig.json` (target ES2022)
- **No `any`**: Tuyệt đối không dùng. Dùng `unknown` hoặc interface cụ thể
- **Interfaces over Classes**: Ưu tiên interface cho data structures
- **Zod Validation**: Tất cả API input/output dùng Zod schemas (`src/api/schemas/`)
- **Type Exports**: Dùng `export type` cho type-only exports

## File Naming & Structure
- **Kebab-case**: Tên file dài mô tả rõ mục đích (ví dụ: `fee-aware-cross-exchange-spread-calculator.ts`)
- **Max 200 lines**: Tách thành modules nhỏ nếu vượt quá
- **Directory Focus**: Mỗi thư mục có một concern duy nhất
- **Test files**: `*.test.ts` cùng thư mục hoặc trong `tests/`

## Architecture Patterns
- **Duck-typed interfaces**: Auth middleware dùng duck types thay vì import trực tiếp Fastify types
- **Factory pattern**: BullMQ workers, Redis connections dùng factory functions
- **Event-driven**: WebSocket price feeds emit events, consumers subscribe
- **Atomic execution**: Cross-exchange orders dùng Promise.allSettled + rollback

## Implementation Guidelines
- **Error Handling**: `try-catch` cho tất cả async ops, structured error objects
- **Async/Await**: Không dùng `.then()` chains
- **Dependency Injection**: Constructor injection cho testability
- **Graceful shutdown**: SIGINT/SIGTERM handlers cho API server, WebSocket, workers

## API Standards
- **Fastify 5**: Route registration, Zod schema validation
- **JWT + API Key**: Multi-tenant auth via `tenant-auth-middleware.ts`
- **Rate Limiting**: Sliding window per-tenant, X-RateLimit-* headers
- **RESTful**: POST cho actions (scan, execute), GET cho queries (positions, history)

## Git & Workflow
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`
- **Pre-commit**: `pnpm run typecheck && pnpm run test`
- **No secrets**: .env gitignored, API keys via env vars only

## Enforcement Status (Phase 4 ✅)
✅ **0 TypeScript errors** — all strict mode rules enforced
✅ **0 `any` types** — all values properly typed
✅ **0 console.log** — production-ready code
✅ **0 TODO/FIXME** — no technical debt
✅ **868 tests** — 100% pass rate (Jest 29)
✅ **Kebab-case files** — consistent naming across codebase
✅ **Max 200 lines** — modular file structure verified

Updated: 2026-03-02
