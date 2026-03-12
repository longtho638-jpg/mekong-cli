# TODO/FIXME/XXX/HACK Technical Debt Register

**Generated:** 2026-03-13
**Scope:** Production code only (excluded: tests, templates, generated code, demo blocks)
**Status:** Active tracking

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Resolved | 0 | - |
| Deferred (Valid Future Work) | 2 | Open |
| False Positives (Keepers) | 14 | N/A - These ARE the checkers |
| Removed | 0 | - |

---

## Deferred: Valid Future Enhancements

### 1. OCOP LLM Integration

**Location:** `src/commands/ocop_commands.py`
**Lines:** 83, 153
**Priority:** LOW
**Risk:** LOW - Feature stubs work but use mock data

**TODO #1 (Line 83):**
```python
# TODO: Integrate with LLM client for actual analysis
```
**Context:** `analyze()` command generates stub analysis with hardcoded HS codes, quality grades, and market suggestions.

**TODO #2 (Line 153):**
```python
# TODO: Integrate with LLM client for actual listing generation
```
**Context:** `export_listing()` command generates stub B2B listings with hardcoded titles, prices, and certifications.

**Impact:**
- Commands are functional but return mock data
- No actual AI analysis of product images/JSON
- No platform-specific listing optimization

**Resolution Options:**
1. **Implement LLM integration** - Use `src/core/llm_client.py` to send product data to LLM for analysis
2. **Keep as demo feature** - Document as placeholder for future implementation
3. **Remove commands** - If OCOP feature is deprecated

**Recommended:** Option 1 - Implement when OCOP feature becomes priority

---

## False Positives: Required Checkers (Do Not Remove)

These "TODO" mentions are part of the quality check infrastructure itself - they detect TODOs in OUTPUT, not mark tech debt in code:

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/output_verifier.py` | 31-32 | Regex patterns detecting TODO/FIXME in LLM output |
| `src/core/verifier.py` | 428, 442-443 | Binh Phap quality gate checking for TODOs |
| `src/core/code_evolution.py` | 161-168 | Self-modification scanner detecting TODO markers |
| `src/core/company_init.py` | 79 | Agent prompt: "Never create code with placeholders or TODOs" |
| `src/core/company_workflow.py` | 180 | Deploy goal: "tests, no TODOs, no secrets" |
| `mekong/daemon/src/agent_dispatcher.py` | 369-370 | Placeholder comment detector function |
| `apps/openclaw-worker/src/agent_dispatcher.py` | 369-370 | Duplicate of above |
| `mekong/daemon/config.js` | 105 | Command string: "TODO/FIXME/HACK count" |
| `apps/openclaw-worker/config.js` | 105 | Duplicate of above |
| `mekong/daemon/builder-daemon.js` | 45-46 | Grep TODOs scanner comment |
| `apps/openclaw-worker/daemons/builder-daemon.js` | 45-46 | Duplicate of above |

**These are NOT tech debt - they are the anti-tech-debt infrastructure.**

---

## Demo/Test Code (Excluded from Scope)

### API Key Rotator Demo

**Location:** `mekong/skills/common/api_key_rotator.py`
**Lines:** 217-219
**Pattern:** `"AIzaTest1_XXXXXXXXXXXXXXXXXXXXXXXX"`

```python
if __name__ == '__main__':
    test_keys = [
        "AIzaTest1_XXXXXXXXXXXXXXXXXXXXXXXX",  # Demo keys
        "AIzaTest2_XXXXXXXXXXXXXXXXXXXXXXXX",
        "AIzaTest3_XXXXXXXXXXXXXXXXXXXXXXXX",
    ]
```

**Status:** ACCEPTABLE - This is demo code in `__main__` block, not production code
**Risk:** NONE - Never executed in production context

---

## Files with Valid Comments (Not TODOs)

These files have "TODO" in comments but they are validation/format references:

| File | Line | Comment Type | Keep |
|------|------|--------------|------|
| `apps/starter-template/activate.py` | 46, 62, 67, 75 | License format validation | ✅ |

---

## Resolution History

### 2026-03-13 - Initial Audit

**Analyzed Files:**
- `src/core/*.py` - Core engine (verifier, output_verifier, code_evolution, company_init, company_workflow)
- `src/commands/*.py` - CLI commands (ocop_commands.py)
- `mekong/daemon/**/*.py` and `.js` - Daemon services
- `apps/openclaw-worker/**/*.py` and `.js` - Worker services

**Findings:**
- 2 deferred TODOs (OCOP LLM integration)
- 14 false positives (quality check infrastructure)
- 0 critical tech debt items
- 0 items requiring immediate action

**Actions:**
- Created this register for tracking
- No code changes required at this time

---

## Tech Debt Policy

### What Counts as Tech Debt

✅ **Counts:**
- `TODO:` comments indicating incomplete features
- `FIXME:` comments indicating known bugs
- `XXX:` comments indicating questionable code
- `HACK:` comments indicating workarounds

❌ **Does NOT Count:**
- Quality checker code that detects TODOs (meta-code)
- Prompt templates that say "no TODOs" (instructions)
- Demo/test code in `if __name__ == '__main__'` blocks
- Comments describing formats (e.g., "Expected: AGENCYOS-XXXX-XXXX")
- Command strings that grep for TODOs (the grepper itself)

### Resolution Strategy

1. **Simple fixes** → Implement immediately
2. **Complex features** → Create GitHub issue, update comment with issue link
3. **Outdated comments** → Remove comment
4. **Valid future work** → Document here, keep comment

---

## Related Documents

- `TECHNICAL_DEBT_RESOLVED.md` - Previously resolved tech debt (PayPal LIVE mode)
- `code-standards.md` - Code quality standards
- `development-rules.md` - Development workflow rules
