---
description: 🚀 GO-LIVE - Production deployment verification
---

# /go-live - Deployment Verification

> **"Kiểm tra toàn diện trước Go-Live"** - Complete pre-deploy check

## Usage

```bash
/go-live [options]
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--domain` | Domain to verify | `/go-live --domain agencyos.network` |
| `--skip-ci` | Skip CI check | `/go-live --skip-ci` |
| `--full` | Full verification | `/go-live --full` |

## Checklist

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| CI/CD | GitHub Actions API | All workflows green |
| Domain | `curl -I https://domain` | HTTP 200 |
| Lint | `pnpm run lint` | 0 errors |
| Types | `pnpm run typecheck` | 0 errors |
| Tests | `pnpm run test` | All pass |
| Security | Grep for secrets | No matches |

## Execution Protocol

1. **Agent**: Delegates to `go-live-verifier`.
2. **Run**: All checklist items.
3. **Report**: GO-LIVE COMPLETE or BLOCKED.

## Examples

```bash
# Full verification
/go-live --domain agencyos.network --full

# Skip CI check
/go-live --domain example.com --skip-ci
```

## Win-Win-Win
- **Owner**: No broken deploys.
- **Agency**: Confidence in releases.
- **Client**: Zero downtime.
