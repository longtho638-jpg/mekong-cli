---
phase: 4
title: "CI/CD & Deployment Hardening"
status: completed
priority: P1
effort: 3h
depends_on: [phase-01]
---

# Phase 4: CI/CD & Deployment Hardening

## Context Links

- Research: [Infra Readiness](research/researcher-02-infra-deployment-readiness.md)
- Rules: binh-phap-cicd.md (ĐIỀU 49 — GREEN production), ĐIỀU 56 (port 9191)
- Workflows: `.github/workflows/deploy.yml`, `test.yml`

## Overview

Harden CI/CD pipeline: thêm post-deploy smoke test, optimize Docker images, strengthen test workflow. Tuân thủ ĐIỀU 49 (GREEN production rule).

## Key Insights

- `deploy.yml` thiếu post-deploy verification → vi phạm ĐIỀU 49
- `test.yml` chạy pytest nhưng không check coverage threshold
- 6 Dockerfiles tồn tại, chưa audit size/security
- Turbo pipeline OK nhưng thiếu lint + security scan steps

## Requirements

### Functional
- Post-deploy smoke test tự động sau mỗi deploy
- Test coverage reporting trong CI
- Docker image ≤ 500MB (production)

### Non-functional
- CI pipeline ≤ 5 phút
- Deployment rollback khả dụng

## Related Code Files

### Cần sửa
- `.github/workflows/deploy.yml` — thêm smoke test
- `.github/workflows/test.yml` — thêm coverage + lint
- `Dockerfile` (root) — optimize multi-stage build

### Tham khảo
- `docker-compose.prod.yml` — production compose
- `turbo.json` — build pipeline config

## Architecture

### Enhanced CI/CD Pipeline

```
Push to main
├── test.yml (parallel)
│   ├── Python pytest + coverage ≥ 70%
│   ├── Lint (ruff + black --check)
│   └── Security scan (pip-audit)
├── deploy.yml (sequential, after test)
│   ├── Docker build (multi-stage, ≤500MB)
│   ├── Push to GCR
│   ├── Deploy to Cloud Run
│   └── POST-DEPLOY SMOKE TEST ←── THÊM MỚI
│       ├── curl /health → HTTP 200
│       ├── curl /api/version → match deployed version
│       └── Slack/Discord notification
└── publish-packages.yml (on release only)
```

## Implementation Steps

### 1. Thêm post-deploy smoke test vào deploy.yml (1h)

```yaml
# Thêm step sau deploy:
- name: Post-deploy smoke test
  run: |
    MAX_ATTEMPTS=10
    ATTEMPT=0
    DEPLOY_URL="${{ secrets.DEPLOY_URL }}"
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
      ATTEMPT=$((ATTEMPT + 1))
      HTTP_STATUS=$(curl -sI "$DEPLOY_URL/health" -o /dev/null -w '%{http_code}')
      echo "Attempt $ATTEMPT: HTTP $HTTP_STATUS"
      [ "$HTTP_STATUS" = "200" ] && echo "SMOKE TEST PASSED" && exit 0
      sleep 15
    done
    echo "SMOKE TEST FAILED" && exit 1
```

### 2. Enhance test.yml (45min)

```yaml
# Thêm steps:
- name: Lint check
  run: |
    ruff check src/ tests/
    black --check src/ tests/

- name: Coverage check
  run: |
    python3 -m pytest tests/ --cov=src --cov-report=term --cov-fail-under=70

- name: Security audit
  run: pip-audit --strict
```

### 3. Docker optimization (45min)

1. Audit current Dockerfile — identify bloat
2. Multi-stage build: builder → production
3. Use slim base image (`python:3.11-slim`)
4. Copy only necessary files (exclude tests, docs, .claude)
5. `.dockerignore` — exclude dev files

```dockerfile
# Optimized pattern:
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --only main --no-root

FROM python:3.11-slim AS production
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
COPY api/ ./api/
ENV PATH="/app/.venv/bin:$PATH"
CMD ["uvicorn", "src.core.gateway:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4. Thêm .dockerignore (15min)

```
.git
.claude
.venv
tests/
docs/
plans/
_bmad/
apps/
node_modules/
*.md
```

## Todo List

- [ ] Thêm post-deploy smoke test vào `deploy.yml`
- [ ] Thêm lint check (ruff + black) vào `test.yml`
- [ ] Thêm coverage threshold (≥70%) vào `test.yml`
- [ ] Thêm `pip-audit` security scan
- [ ] Optimize root Dockerfile → multi-stage, ≤500MB
- [ ] Tạo/cập nhật `.dockerignore`
- [ ] Test CI pipeline locally: `act` hoặc push test branch

## Success Criteria

- `deploy.yml` có smoke test → curl /health 200 OK
- `test.yml` fail nếu coverage < 70%
- `docker build .` → image ≤ 500MB
- Full CI pass trên test branch trước merge

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Smoke test flaky (timing) | False failures | 10 retries, 15s interval = 2.5min window |
| Coverage threshold quá cao | CI blocks merges | Bắt đầu 70%, tăng dần |
| pip-audit strict mode | Block deploy do transitive deps | Dùng `--ignore` cho known false positives |

## Security Considerations

- pip-audit catch known CVEs trong dependencies
- Docker multi-stage: production image không có dev tools
- `.dockerignore` ngăn leak secrets/configs vào image

## Next Steps

→ Phase 5 (Docs) — document CI/CD pipeline cho contributors
