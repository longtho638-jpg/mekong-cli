---
name: engineering-ops
description: Developer experience, CI/CD pipelines, code quality, incident management, SRE practices. Use for engineering productivity, release management, on-call, postmortems.
license: MIT
version: 1.0.0
---

# Engineering Ops Skill

Optimize engineering productivity with CI/CD, developer experience, incident management, and SRE practices.

## When to Use

- Setting up CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI)
- Developer experience (DX) improvements and tooling
- Code quality gates and automated reviews
- Release management and versioning strategies
- Incident response and on-call rotation
- Postmortem writing and process improvement
- Engineering metrics and DORA tracking
- Monorepo management (Turborepo, Nx)
- Feature flags and progressive rollouts

## Tool Selection

| Need | Choose |
|------|--------|
| CI/CD | GitHub Actions, GitLab CI, CircleCI |
| Code quality | SonarQube, CodeClimate, Codacy |
| Feature flags | LaunchDarkly, Unleash, Flagsmith |
| Incident management | PagerDuty, Incident.io, OpsGenie |
| Status page | Statuspage.io, Betteruptime, Instatus |
| Release management | semantic-release, changesets, Release Please |
| Monorepo | Turborepo, Nx, moon |
| Error tracking | Sentry, Bugsnag, Rollbar |
| Internal tools | Retool, Tooljet, Appsmith |
| API documentation | Swagger/OpenAPI, Redoc, Stoplight |

## DORA Metrics

| Metric | Elite | High | Medium | Low |
|--------|-------|------|--------|-----|
| Deployment Frequency | On-demand (multiple/day) | Weekly-monthly | Monthly-6mo | > 6mo |
| Lead Time for Changes | < 1 hour | 1 day - 1 week | 1-6 months | > 6 months |
| Change Failure Rate | < 5% | 5-10% | 10-15% | > 15% |
| Mean Time to Recovery | < 1 hour | < 1 day | < 1 week | > 1 week |

## CI/CD Pipeline Template

```yaml
# GitHub Actions: Standard pipeline
name: CI/CD
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint          # Code quality
      - run: npm run type-check    # Type safety
      - run: npm run test          # Unit tests
      - run: npm run build         # Build verification

  deploy:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      # Deploy step (Vercel, Cloudflare, etc.)
```

## Incident Response Framework

```
1. DETECT    → Monitoring alert fires (Sentry, Datadog, UptimeRobot)
2. TRIAGE    → Severity classification (SEV1-4), assign incident commander
3. MITIGATE  → Immediate actions (rollback, feature flag off, scale up)
4. RESOLVE   → Root cause fix deployed and verified
5. POSTMORTEM → Blameless review within 48h, action items tracked
```

## Postmortem Template

```markdown
# Incident: [Title] — [Date]
## Summary: [1-2 sentence overview]
## Impact: [Duration, users affected, revenue impact]
## Timeline:
- HH:MM — [Event description]
## Root Cause: [Technical explanation]
## Resolution: [What fixed it]
## Action Items:
- [ ] [Preventive measure] — Owner — Due date
## Lessons Learned: [What went well, what didn't]
```

## Key Best Practices (2026)

**Shift Left:** Tests, security scans, type checks in PR pipeline — catch issues early
**Trunk-Based Development:** Short-lived branches (<1 day), feature flags for incomplete work
**Blameless Postmortems:** Focus on systems, not people — "how did the system allow this?"
**Developer Portal:** Backstage or custom internal portal for service catalog, docs, tooling
**Platform Engineering:** Self-service infrastructure — devs deploy without ops tickets

## References

- `references/cicd-pipeline-patterns.md` - GitHub Actions, semantic-release, deployment strategies
- `references/incident-management-playbook.md` - On-call, escalation, postmortem workflows
