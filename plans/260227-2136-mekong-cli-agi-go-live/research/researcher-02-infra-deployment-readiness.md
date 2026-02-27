# Báo Cáo: Infrastructure & Deployment Readiness — AGI GO LIVE
**Ngày:** 2026-02-27 | **Researcher:** 02-infra-deployment-readiness

---

## 1. CI/CD Status

**Workflows hiện tại** (`.github/workflows/`):
| File | Mục đích | Tình trạng |
|------|----------|-----------|
| `deploy.yml` | Deploy lên GCP Cloud Run | HOẠT ĐỘNG — trigger on push to `main` |
| `test.yml` | Chạy Python pytest | HOẠT ĐỘNG — trigger on push/PR |
| `publish-packages.yml` | Publish `@agencyos/core`, `@agencyos/agents` lên npm | HOẠT ĐỘNG — trigger on release |
| `84tea-ci.yml` | CI cho 84Tea app | Có |
| `agencyos-landing-ci.yml` | CI cho AgencyOS Landing | Có |
| `daily-repo-status.md` | Status report hàng ngày | Có |
| `tom-hum-test.md` | Test Tôm Hùm | Có |

**Vấn đề nghiêm trọng:**
- `deploy.yml` vẫn còn **PAYPAL secrets** (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`) — vi phạm ĐIỀU payment-provider.md (ALL-IN POLAR.SH, CẤM PAYPAL)
- Deploy target là `mekong-api` service trên GCP Cloud Run — không có smoke test post-deploy
- Không có CI/CD GREEN verification sau push (vi phạm ĐIỀU 49)

---

## 2. Deployment Readiness

**Docker/Containerization:**
- `Dockerfile` tồn tại ở: `api/`, `apps/web/`, `apps/api/`, `apps/worker/`, `apps/engine/`, `apps/agencyos-landing/`
- `docker-compose.yml` có ở root, `infrastructure/`, `doanh-trai-tom-hum/`, `apps/apex-os/`
- `docker-compose.prod.yml` — production compose file tồn tại ở root

**Cloudflare Workers:**
- `apps/raas-gateway/wrangler.toml` — RaaS API Gateway ready
- `apps/antigravity-gateway/wrangler.toml` — Antigravity Gateway ready

**Tình trạng:**
- Có đủ Docker configs cho containerized deployment
- Cloudflare Workers (raas-gateway, antigravity-gateway) deployment-ready via `wrangler.toml`
- GCP Cloud Run target qua GitHub Actions hoạt động

**Blockers:**
- Không tìm thấy secrets `GCP_SA_KEY` trong git — cần verify GitHub Secrets đã cấu hình
- PayPal secrets trong `deploy.yml` cần xóa ngay — vi phạm constitutional rule

---

## 3. Tôm Hùm Daemon Health

**Phiên bản:** v2026.2.27 AGI Deep Upgrade Edition

**Kiến trúc modular (đã refactor từ monolith 56KB):**
- `brain-process-manager.js` — facade 37 dòng, re-export từ sub-modules
- 70+ modules trong `lib/` — đủ các lớp: Core, Reliability, Observability, Mission Management, Autonomous Planning

**Tính năng AGI L3-L5:**
- AGI L3: `post-mission-gate.js` — auto verify build + auto commit
- AGI L4: `project-scanner.js` — scan tech debt mỗi 30 phút
- AGI L5: `learning-engine.js` + `evolution-engine.js` — self-learning từ history

**Health Monitoring:**
- `brain-health-server.js` — HTTP endpoint port 9090 (`GET /health`, `GET /metrics`)
- `agi-score-calculator.js` — 5-dimension scoring (reliability/autonomy/learning/safety/throughput)
- Circuit breaker, heartbeat watchdog, stagnation detector — đầy đủ

**Dual Brain Mode:**
- Default: `direct` (claude -p per-mission) — không cần tmux
- Fallback: `tmux` — persistent session

**Proxy config không nhất quán:**
- `task-watcher.js` dùng port `9191` (Antigravity proxy)
- `apps/openclaw-worker/CLAUDE.md` ghi ENGINE dùng port `20128`
- Root `CLAUDE.md` (ĐIỀU 56) khóa cứng port `9191`
- **BLOCKER:** Cần đồng bộ port proxy về `9191` theo ĐIỀU 56

---

## 4. Monorepo Build Pipeline

**Root `package.json` v2.1.33:**
- Turbo v2.1.3 pipeline: `build`, `test`, `lint`, `dev`, `format`
- Workspaces: `packages/*`, `apps/*`, `frontend`
- Engine: Node >= 18, npm >= 9

**`turbo.json`:**
- `build` → outputs: `dist/**`, `.next/**`, dependsOn `^build` (topological)
- `test` → dependsOn `build`, inputs: `src/**/*.{ts,tsx}`
- `dev` → persistent mode, no cache

**Packages SDK (Open Source):**
- `@agencyos/raas-core` v0.1.0 — `packages/core/`
- `@agencyos/agents` v0.1.0 — `packages/agents/`
- Publish pipeline qua `publish-packages.yml` — sẵn sàng publish lên npm với NPM_TOKEN

**Tình trạng:**
- Turbo pipeline cơ bản OK
- 2 packages npm-ready (`core`, `agents`) — chưa published (v0.1.0)
- Thiếu `pnpm-lock.yaml` rõ ràng — package.json dùng npm, cần kiểm tra package manager nhất quán
- `packages/CLAUDE.md` ghi "Hub Architecture (Planned)" — nhiều packages chưa hoàn thiện (`ui`, `business`, `tooling`, `integrations`)

---

## 5. Blocking Issues (Ưu tiên cao)

| # | Vấn đề | Mức độ | Action |
|---|--------|--------|--------|
| 1 | **PayPal secrets trong `deploy.yml`** — vi phạm Hiến Pháp | CRITICAL | Xóa PAYPAL_* secrets, migrate sang POLAR_* |
| 2 | **Port proxy mâu thuẫn** — ĐIỀU 56 nói 9191, openclaw-worker CLAUDE.md nói 20128 | HIGH | Chuẩn hóa về 9191 hoặc cập nhật config.js |
| 3 | **Không có post-deploy smoke test** trong `deploy.yml` — vi phạm ĐIỀU 49 | HIGH | Thêm curl health check sau deploy |
| 4 | **Packages v0.1.0 chưa published** — AGI GO LIVE cần SDK stable | MEDIUM | Chạy `publish-packages.yml` sau release tag |
| 5 | **Nhiều packages "Planned"** trong Hub Architecture | MEDIUM | Scope rõ V1 packages trước GO LIVE |

---

## Câu hỏi chưa giải quyết

- GitHub Secrets (`GCP_SA_KEY`, `NPM_TOKEN`) đã được cấu hình chưa?
- Port chính thức của Antigravity Proxy là 9191 hay 20128? (2 file config mâu thuẫn nhau)
- AGI GO LIVE scope: toàn bộ monorepo hay chỉ `openclaw-worker` + packages?
