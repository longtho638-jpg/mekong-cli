# Planner Report: Phase 3 Hardening Scan

**Agent:** planner | **ID:** adc4aca
**Date:** 2026-01-20 13:35
**Scope:** `antigravity/` and `cli/` directories

---

## Summary

| Metric | Value |
|--------|-------|
| Files Scanned | ~150 (antigravity + cli) |
| Active TODOs Found | 0 |
| Security Issues | 2 actionable |
| Config Gaps | 1 minor |
| Estimated Fix Effort | 2-3 hours |

---

## Findings Matrix

### 1. Technical Debt (TODO/FIXME/XXX)

**Result: CLEAN**

| Pattern | Count | Notes |
|---------|-------|-------|
| TODO | 0 | Clean |
| FIXME | 0 | Clean |
| XXX | 0 | Clean |
| HACK | 0 | Clean |
| BUG | 6 | Documentation only (already fixed bugs) |

No action required.

---

### 2. Security Vulnerabilities

| Issue | Severity | Location | Action |
|-------|----------|----------|--------|
| Pickle deserialization | HIGH | redis_backend.py:94 | Replace with JSON/msgpack |
| Default token fallback | MEDIUM | vibe_kanban_bridge.py:27 | Remove fallback, fail gracefully |
| Subprocess calls | LOW | 13 instances | Already safe (no shell=True) |

---

### 3. Secrets & Credentials

| Check | Result |
|-------|--------|
| Hardcoded API keys | None found |
| Hardcoded passwords | None found |
| Hardcoded tokens | 1 (default_token - not real key) |
| eval/exec usage | None |

Existing protections:
- `hook_executor.py` - Pattern detection for GitHub tokens
- `code_guardian/scanner.py` - Sensitive data scanner
- `telemetry.py` - Key/secret sanitization
- `privacy-block.cjs` - .env access control

---

### 4. Configuration Management

| File | Gitignored | Status |
|------|------------|--------|
| .env | Yes | OK |
| .env.local | Yes | OK |
| .env.production | **No** | Needs fix |

Config.py Assessment:
- `core/config.py`: Uses Pydantic Settings correctly
- All API keys use `Optional[str]` with `default=None`
- Validators present for URL formats

---

## Recommendations

### Priority 1 (Block Go-Live)
1. **Replace pickle with JSON/msgpack** in redis_backend.py
   - Pickle is RCE vector if queue is compromised
   - Use `job.model_dump()` + `Job.model_validate()` pattern

### Priority 2 (Should Fix)
2. **Remove default_token fallback** in vibe_kanban_bridge.py
   - Pattern: fail closed, not open
   - Disable feature if not configured

### Priority 3 (Nice to Have)
3. **Add .env.production to .gitignore**
4. **Create .env.example** with all required vars documented

---

## Files Created

- Plan: `/Users/macbookprom1/mekong-cli/plans/260120-1335-phase-3-hardening/plan.md`
- Report: `/Users/macbookprom1/mekong-cli/plans/reports/planner-260120-1335-phase-3-hardening.md`

---

## Unresolved Questions

1. **Queue Migration:** Are there existing jobs serialized with pickle that need migration?
2. **Kanban Usage:** Is vibe_kanban_bridge actively used? If not, consider deprecating.
3. **Redis Backend:** Is this deployed in production or development-only?

---

*Binh Phap: "Truoc khi tan cong, phai hieu dia hinh."*
