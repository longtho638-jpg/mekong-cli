# CTO SOPs — Standard Operating Procedures

> Chief Technology Officer — kiến trúc, code quality, infrastructure, tech debt.

---

## SOP-T00: CTO Scope

```
CTO                              NOT CTO (delegate)
──────────────────────────────────────────────────────
Architecture decisions           Trade execution (Trader)
Code quality standards           Budget allocation (CEO)
Infrastructure scaling           Incident response (COO)
Tech debt management             Marketing (CMO)
CI/CD pipeline                   Risk limits (Founder)
Testing strategy                 Emergency halt (Founder)
Performance optimization         Capital decisions (CEO)
Security architecture            Business strategy (CEO)
```

## SOP-T01: Weekly Tech Review (1h)

```bash
# 1. Build health
tsc --noEmit 2>&1 | tail -5

# 2. Test suite health
pnpm test 2>&1 | tail -10

# 3. Tech debt scan
grep -r "TODO\|FIXME\|@ts-ignore\|: any" src/ --include="*.ts" | wc -l

# 4. File size audit (>200 lines)
find src/ -name "*.ts" -exec wc -l {} + | sort -rn | head -10

# 5. Dependency audit
pnpm audit 2>&1 | tail -5
```

## SOP-T02: Architecture Governance

| Layer | Owner | Standard |
|-------|-------|----------|
| Core Engine | CTO | Plan-Execute-Verify pattern |
| Strategies | CTO | SignalGenerator consensus |
| Execution | CTO | Stealth stack + circuit breakers |
| Pipeline | CTO | WorkflowPipelineEngine nodes |
| A2UI | CTO | Event-driven agent-to-user |
| Data | CTO | TickStore + HealthManager |

**Rules:**
- No new module without architecture review
- Max file size: 200 lines
- All public methods: type hints + docstring
- New feature = new tests required

## SOP-T03: Tech Debt Management

| Priority | Type | Target | Verification |
|----------|------|--------|-------------|
| P0 | `@ts-ignore` | 0 | `grep -r "@ts-ignore" src/` |
| P0 | `: any` types | 0 | `grep -r ": any" src/` |
| P1 | `TODO/FIXME` | 0 | `grep -r "TODO\|FIXME" src/` |
| P1 | `console.log` | 0 | `grep -r "console\." src/` |
| P2 | Files >200 lines | 0 | `wc -l` audit |
| P2 | Missing tests | 0 | Coverage report |

## SOP-T04: Performance Standards

| Metric | Target | Check |
|--------|--------|-------|
| Build time | <10s | `time tsc --noEmit` |
| Test suite | <3min | `time pnpm test` |
| Order latency | <500ms | Execution reports |
| Bundle size | <500KB | Build output |
| Memory usage | <500MB | Process monitor |

## SOP-T05: CTO Checklist

### Weekly
```
□ Build + test suite GREEN
□ Tech debt scan (SOP-T03)
□ Performance check (SOP-T04)
□ Code review backlog
□ Architecture decision log updated
```

### Monthly
```
□ Dependency update + audit
□ Infrastructure scaling review
□ Test coverage report
□ Security vulnerability scan
□ Tech roadmap progress check
```

---

*SOPs v1.0 — 2026-03-03*
