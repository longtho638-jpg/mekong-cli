---
phase: 4
title: "Production Hardening"
priority: P1
effort: 1h
status: pending
depends_on: [phase-01]
---

# Phase 4: Production Hardening

## Context Links
- [Plan tổng](plan.md) | [Phase 1](phase-01-fix-ci-green.md)
- `.gitignore`, `.env.example`, `docker-compose.agi.yml`

## Overview
- **Ngày:** 2026-02-28
- **Mô tả:** Security scan, gitignore audit, env vars verification, Docker health checks
- **Priority:** P1
- **Status:** pending (blocked by Phase 1)

## Key Insights
1. Monorepo chứa nhiều apps (84tea, sophia, apex-os) — risk secrets rải rác
2. `docker-compose.agi.yml` có Qdrant + Langfuse — cần health checks
3. `.env.example` cần cover tất cả vars mà code reference
4. Git history có thể chứa leaked secrets (cần scan)

## Requirements
### Functional
- `pip-audit` pass (0 HIGH vulnerabilities)
- `.gitignore` cover tất cả sensitive files
- `.env.example` hoàn chỉnh
- Docker services có health checks

### Non-functional
- Scan hoàn thành < 5 phút
- Không có false positives block workflow

## Related Code Files
### Modify
- `.gitignore` — thêm patterns nếu thiếu
- `.env.example` — sync với tất cả env vars trong code
- `docker-compose.agi.yml` — thêm healthcheck nếu thiếu

### Verify
- Git history (secrets scan)

## Implementation Steps

### Step 1: Scan secrets trong git history (15 phút)

```bash
cd /Users/macbookprom1/mekong-cli

# Install truffleHog (lightweight)
pip install trufflehog

# Scan recent 50 commits
trufflehog git file://. --since-commit HEAD~50 --only-verified 2>&1 | head -50

# Hoặc dùng gitleaks (nếu có)
# gitleaks detect --source . --verbose
```

Nếu tìm thấy secrets:
1. Rotate key ngay lập tức
2. KHÔNG rewrite history (too disruptive) — revoke old key thay vì remove commit
3. Document trong security log

### Step 2: Audit .gitignore (10 phút)

Verify `.gitignore` chứa:

```gitignore
# Secrets
.env
.env.local
.env.production
*.pem
*.key
*.p12

# Python
__pycache__/
*.pyc
.mypy_cache/
.ruff_cache/
dist/
*.egg-info/

# Node
node_modules/
.next/
.turbo/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Mekong specific
.mekong/
*.log
/tmp/
```

### Step 3: Audit .env.example (15 phút)

```bash
# Tìm tất cả env var references trong src/
grep -roh 'os\.environ\[.\([^]]*\).\]' src/ | sort -u
grep -roh 'os\.getenv(.\([^)]*\).)' src/ | sort -u
grep -roh 'env\.\([A-Z_]*\)' src/ | sort -u

# So sánh với .env.example
cat .env.example
```

Mỗi env var trong code PHẢI có entry trong `.env.example` với description.

### Step 4: Dependency vulnerability scan (10 phút)

```bash
# Python deps
pip install pip-audit
pip-audit -r requirements.txt

# Node deps (monorepo)
pnpm audit --audit-level=high 2>/dev/null || echo "pnpm audit needs lockfile"
```

Fix HIGH/CRITICAL vulnerabilities hoặc document accepted risks.

### Step 5: Docker health checks (10 phút)

Verify `docker-compose.agi.yml` có healthcheck cho mỗi service:

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  langfuse:
    image: langfuse/langfuse:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/public/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 6: Commit (5 phút)

```bash
git add .gitignore .env.example docker-compose.agi.yml
git commit -m "fix(security): harden gitignore, env vars, docker health checks"
git push origin master
```

## Todo List
- [ ] Run secrets scan (trufflehog/gitleaks)
- [ ] Audit `.gitignore` — thêm missing patterns
- [ ] Audit `.env.example` — sync tất cả env vars
- [ ] Run `pip-audit` — fix HIGH vulns
- [ ] Thêm Docker health checks nếu thiếu
- [ ] Commit & push

## Success Criteria
1. `pip-audit` → 0 HIGH/CRITICAL
2. `trufflehog` → 0 verified secrets trong recent history
3. `.env.example` cover 100% env vars trong `src/`
4. Docker compose services có healthcheck

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Leaked secrets trong git history | CRITICAL | Rotate keys ngay, không rewrite history |
| pip-audit false positives | LOW | Document accepted risks |
| Docker healthcheck URL sai | LOW | Test local: `docker compose up && curl localhost:6333/healthz` |

## Security Considerations
- Đây là phase security-focused
- KHÔNG commit `.env` files
- Rotate bất kỳ key nào bị leaked
- Pin Docker image versions (không dùng `:latest` trong production)

## Next Steps
- Cân nhắc thêm `pip-audit` vào CI pipeline (phase tương lai)
- Setup Dependabot cho automatic vuln alerts
