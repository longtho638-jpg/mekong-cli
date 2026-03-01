# Production Security Audit — mekong-cli
**Date:** 2026-03-01
**Auditor:** code-reviewer subagent
**Scope:** `src/core/`, `src/agents/`, `src/raas/`, `apps/openclaw-worker/`, `apps/raas-gateway/`
**Lines analyzed:** ~12,553 Python + ~156 JS

---

## Code Review Summary

### Scope
- Files reviewed: 51 core modules + 6 agent files + 4 raas files + 2 JS apps
- Lines of code analyzed: ~12,709
- Review focus: Security, injection, CORS, auth, code quality
- Updated plans: none (no plan file provided)

### Overall Assessment
Codebase is well-structured with solid patterns in most areas (HMAC signing, Pydantic validation, proper env var usage). However, several **HIGH severity** security gaps exist — most critically: the FastAPI gateway exposes ~20 unauthenticated endpoints, `shell=True` propagates untrusted user input in 5 locations, and the Telegram bot has no chat ID authorization whitelist.

---

## Critical Issues

### CRIT-1: Unauthenticated Gateway Endpoints (CRITICAL)
**File:** `src/core/gateway.py`
**Severity:** CRITICAL

Of ~27 endpoints, only `/cmd` (line 375) and `/ws` (line 401) and `/halt` (line 703) verify the token. All others are completely unauthenticated:

```
UNAUTHENTICATED:
  GET  /presets          → lists all preset actions
  GET  /projects         → reveals internal project paths
  GET  /memory/recent    → exposes execution history + goals
  GET  /memory/stats     → same
  GET  /memory/search    → searchable execution memory
  GET  /governance/audit → exposes audit trail
  POST /nlu/parse        → free LLM parsing
  POST /recipes/generate → free LLM recipe generation
  POST /recipes/validate → free resource usage
  POST /swarm/register   → anyone can register a swarm node
  GET  /swarm/nodes      → reveals internal topology
  POST /swarm/dispatch   → dispatches goals to nodes WITHOUT auth
  DELETE /swarm/nodes/{id} → removes nodes without auth
  POST /schedule/jobs    → creates scheduled jobs without auth
  DELETE /schedule/jobs/{id} → deletes jobs without auth
  GET  /autonomous/consciousness → leaks system health
  POST /governance/check → free classification
  GET  /api/agi/health   → leaks AGI daemon status
  GET  /api/agi/metrics  → leaks metrics
```

`/swarm/dispatch` is particularly dangerous — it dispatches arbitrary goals to remote nodes with no auth at all (line 548-558).

**Fix:** Add `token: str = Depends(verify_token_dep)` dependency to all protected routes, or add a FastAPI middleware that validates token for all non-health endpoints.

---

### CRIT-2: Telegram Bot Has No Authorization (CRITICAL)
**File:** `src/core/telegram_bot.py`
**Severity:** CRITICAL

The bot responds to **any Telegram user** who messages it. The `chat_ids` list (line 45) is used only for _storing_ who contacted the bot — it is never used to _gate_ incoming commands:

```python
# cook_handler (line 280-309): no chat_id check
chat_id = update.effective_chat.id
task = add_task(goal=goal, chat_id=chat_id)  # queued for anyone!
```

Any Telegram user who discovers the bot token can queue arbitrary goals for CC CLI execution on the host machine.

**Fix:** Load an allowlist from env (`MEKONG_ALLOWED_CHAT_IDS`) and reject unauthorized chat IDs at the top of every handler.

---

### CRIT-3: Token Comparison is Timing-Attack Vulnerable (HIGH → CRITICAL in context)
**File:** `src/core/gateway.py:231,703`
**Severity:** HIGH

```python
# Line 231
if token != expected:   # ← plain string compare, timing-attack vector
    raise HTTPException(status_code=401, detail="Invalid token")

# Line 703
if req.token != server_token:  # same issue
```

`billing.py:132` correctly uses `hmac.compare_digest()` but the main gateway does not.

**Fix:**
```python
import hmac as _hmac
if not _hmac.compare_digest(token, expected):
    raise HTTPException(status_code=401, detail="Invalid token")
```

---

## High Priority Findings

### HIGH-1: `shell=True` with User-Controlled Input (INJECTION RISK)
**Files:** Multiple
**Severity:** HIGH

Five locations use `shell=True` where the command string may originate from user input:

| File | Line | Source |
|------|------|--------|
| `src/core/executor.py` | 186 | `step.description` — comes from recipe/goal, which comes from HTTP `/cmd` request |
| `src/core/orchestrator.py` | 501 | `rollback_cmd` — from recipe params, user-controlled if recipe is user-supplied |
| `src/core/verifier.py` | 366 | `command` — custom check spec from recipe |
| `src/core/zx_executor.py` | 159 | `shell()` helper — shell=True always |
| `src/agents/shell_agent.py` | 103 | user input via `cmd_str` |

`shell_agent.py` has a blocklist (lines 13-28) but it is easily bypassed — `rm -rf /tmp/; evil_cmd` won't match any blocked pattern.

**Fix for `executor.py` and `orchestrator.py`:** Parse commands into argument lists and use `shell=False`:
```python
import shlex
subprocess.run(shlex.split(command), shell=False, ...)
```

For `shell_agent.py`: The entire design (arbitrary shell execution) is dangerous by nature. At minimum, add a Governance check before executing any shell command received from Telegram/API.

---

### HIGH-2: Path Traversal in FileAgent (HIGH)
**File:** `src/agents/file_agent.py:131,152`
**Severity:** HIGH

```python
# file_read (line 131):
filepath = Path(self.cwd) / task.input.get("path", "")
# file_write (line 152):
filepath = Path(self.cwd) / task.input.get("path", "")
```

No check that `filepath` is actually within `self.cwd`. A path like `../../etc/passwd` or `/etc/passwd` (absolute) will resolve outside the intended directory.

**Fix:**
```python
filepath = (Path(self.cwd) / task.input.get("path", "")).resolve()
cwd_resolved = Path(self.cwd).resolve()
if not str(filepath).startswith(str(cwd_resolved)):
    return Result(task_id=task.id, success=False, error="Path traversal denied")
```

---

### HIGH-3: No CORS Middleware on FastAPI Gateway (HIGH)
**File:** `src/core/gateway.py`
**Severity:** HIGH

`grep` across entire `src/` finds `CORSMiddleware` only in third-party venv packages. The mekong gateway FastAPI app (`create_app()`) adds no CORS middleware.

This means:
- Browser-based clients can make cross-origin requests freely
- No `Access-Control-Allow-Origin` control
- Dashboard served on `/` can be attacked from any origin

**Fix:** Add CORS middleware in `create_app()`:
```python
from fastapi.middleware.cors import CORSMiddleware
gateway.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("MEKONG_ALLOWED_ORIGINS", "").split(",") or ["http://localhost:*"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

### HIGH-4: Crash Reporter Persists Full Stacktraces to Disk (HIGH)
**File:** `src/core/crash_reporter.py:93,105`
**Severity:** HIGH

```python
traceback_str=traceback.format_exc(),  # full traceback captured
...
crash_path.write_text(json.dumps(payload, indent=2), ...)  # written to .mekong/crashes/
```

Full stack traces include file paths, module internals, and environment details. If `.mekong/crashes/` is served or accessible, it leaks architecture details.

**Fix:** Ensure `.mekong/` is in `.gitignore` (verify this). Consider stripping absolute paths from tracebacks before persistence. Never expose `/crashes/` via gateway.

---

### HIGH-5: Oversized Files Violate 200-Line Limit (HIGH for maintainability)
**Files:** Multiple
**Severity:** HIGH (code standard violation)

Per `./docs/code-standards.md` and development rules: files must be <200 lines.

| File | Lines | Violation |
|------|-------|-----------|
| `src/core/gateway.py` | 772 | 3.86× limit |
| `src/core/telegram_bot.py` | 742 | 3.71× limit |
| `src/core/orchestrator.py` | 624 | 3.12× limit |
| `src/core/agi_loop.py` | 505 | 2.53× limit |
| `src/core/verifier.py` | 468 | 2.34× limit |
| `src/core/planner.py` | 447 | 2.24× limit |
| `src/core/llm_client.py` | 432 | 2.16× limit |
| `src/core/gateway_dashboard.py` | 384 | 1.92× limit |
| `src/core/nlp_commander.py` | 341 | 1.71× limit |
| `src/core/telemetry.py` | 323 | 1.62× limit |
| `src/core/zx_executor.py` | 306 | 1.53× limit |

---

## Medium Priority Improvements

### MED-1: `print()` Calls in Production Core (MEDIUM)
**File:** `src/core/planner.py:276,303,323`
**Severity:** MEDIUM

```python
print("[PLANNER] LLM unavailable — using rule-based fallback")
print("[PLANNER] LLM returned non-JSON — using rule-based fallback")
print(f"[PLANNER] LLM decomposition failed: {e}")
```

Raw `print()` in core modules bypasses any logging infrastructure. These should use `logging.getLogger(__name__)` or the Rich console already available in orchestrator.

---

### MED-2: `type: ignore` Suppressions (MEDIUM)
**Files:** Multiple
**Severity:** MEDIUM

8 `# type: ignore` annotations found. Most are legitimate (untyped third-party libs), but two are concerning:

```python
# src/core/event_bus.py:165
_default_bus: EventBus = None  # type: ignore[assignment]
# src/core/event_bus.py:181
return _default_bus  # type: ignore[return-value]
```

This masks a potential `None` dereference. The singleton pattern should use `Optional[EventBus]` properly.

---

### MED-3: `Any` Type Annotations in Business Logic (MEDIUM)
**Files:** `src/core/swarm.py:203,221,251,270`
**Severity:** MEDIUM

```python
def _route_step(self, step: Any) -> str:
def _dispatch_local(self, step: Any, agent_type: str) -> Any:
def _dispatch_remote(self, step: Any, node: SwarmNode) -> Any:
def dispatch(self, step: Any) -> Any:
```

4 uses of bare `Any` in `swarm.py` and 3 in other modules. Per Binh Phap quality standards (0 `Any` types), these should use proper `RecipeStep` or `Protocol` types.

---

### MED-4: `auto_updater.py` Downloads and Executes Arbitrary Packages (MEDIUM)
**File:** `src/core/auto_updater.py:122-128`
**Severity:** MEDIUM

```python
def apply(self, update_path: Path) -> bool:
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", str(update_path), "--quiet"],
        ...
    )
```

The `download_url` comes from a GitHub API response (line 112). If the update source is compromised or response tampered (no TLS pinning), this executes arbitrary code. No checksum verification before `pip install`.

**Fix:** Verify SHA256 checksum of downloaded artifact against a signed manifest before calling `pip install`.

---

### MED-5: raas-gateway Missing Security Headers (MEDIUM)
**File:** `apps/raas-gateway/index.js`
**Severity:** MEDIUM

Responses do not set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

All responses only set `Content-Type: application/json`. For a Cloudflare Worker, these should be standard.

---

### MED-6: Telegram Bot NLP Handler Exposes Error Details (MEDIUM)
**File:** `src/core/telegram_bot.py:271-273`
**Severity:** MEDIUM

```python
except Exception as e:
    await thinking_msg.edit_text(
        f"❌ NLP error: {str(e)[:100]}\nThử /cook <goal> trực tiếp."
    )
```

Truncated but raw exception messages sent back to Telegram users. On internal errors, this can leak implementation details.

---

## Low Priority Suggestions

### LOW-1: npm audit blocked by missing lockfile
**Files:** `apps/openclaw-worker/`, `apps/raas-gateway/`
**Severity:** LOW

Both JS apps have no `package-lock.json`. `npm audit` cannot run without it. The `workspace:*` protocol in openclaw-worker also blocks lockfile generation.

**Fix:** Generate and commit lockfiles. For workspace protocol issue, use `--legacy-peer-deps` or switch to a supported protocol.

---

### LOW-2: raas-gateway Prompt Injection Filter is Weak (LOW)
**File:** `apps/raas-gateway/index.js:104-120`
**Severity:** LOW

```javascript
const maliciousPatterns = [
  /ignore previous instructions/i,
  /system prompt/i,
  /reveal your secret/i,
  /DROP TABLE/i,
  /DELETE FROM/i,
  /<script>/i
];
```

This blocklist is easily bypassed (unicode substitution, encoding, splitting strings). Prompt injection prevention cannot rely on keyword matching. Consider rate limiting + abuse monitoring instead of regex filters.

---

### LOW-3: Openclaw-Worker No Lockfile / Audit (LOW)
**File:** `apps/openclaw-worker/package.json`
**Severity:** LOW

devDependencies include `wrangler ^4.62.0`, `vitest ~3.2.0`, `@cloudflare/vitest-pool-workers ^0.12.4`. Cannot audit without lockfile. These are dev-only but should still be tracked.

---

## Positive Observations

- **HMAC signing**: `webhook_delivery_engine.py` correctly uses HMAC-SHA256 with `sha256=` prefix. `billing.py` correctly uses `hmac.compare_digest()` — only gateway.py missed this.
- **Pydantic models**: All gateway endpoints use typed Pydantic request/response models with `Field(..., min_length=1)` validation.
- **Env vars for secrets**: No hardcoded API keys or tokens found in source. All credentials loaded from `os.environ`.
- **No `yaml.load()` unsafe usage**: All YAML loading uses safe methods (no unsafe `yaml.load()` found).
- **No `eval`/`exec` in business logic**: Only `asyncio.create_subprocess_exec` (correct usage, not `eval`).
- **Timeout on all subprocess calls**: All `subprocess.run()` calls specify `timeout=`.
- **FileAgent `find` command**: Uses list form (no `shell=True`), properly avoiding injection.
- **RaaS auth**: `src/raas/auth.py` has clean Bearer token validation with proper `mk_` prefix enforcement.
- **Goal sanitization in RaaS**: `src/raas/missions.py:39-41` strips shell metacharacters before execution.
- **`zx_executor.py` `quote()` helper**: Properly wraps `shlex.quote()` for safe argument escaping.

---

## Recommended Actions

1. **[CRITICAL]** Add token auth dependency to all unprotected gateway endpoints — especially `/swarm/dispatch`, `/memory/*`, `/schedule/*`
2. **[CRITICAL]** Add Telegram bot chat ID authorization whitelist from env var `MEKONG_ALLOWED_CHAT_IDS`
3. **[CRITICAL]** Replace `token != expected` with `hmac.compare_digest()` in `gateway.py:231,703`
4. **[HIGH]** Fix path traversal in `file_agent.py` — add `.resolve()` + parent check for `file_read` and `file_write`
5. **[HIGH]** Replace `shell=True` + raw string with `shlex.split()` + `shell=False` in `executor.py:186` and `orchestrator.py:501`
6. **[HIGH]** Add `CORSMiddleware` to FastAPI gateway with explicit origin allowlist
7. **[HIGH]** Split oversized files: `gateway.py` (772 lines) and `telegram_bot.py` (742 lines) are top priority
8. **[MEDIUM]** Replace `print()` in `planner.py` with `logging` or Rich console
9. **[MEDIUM]** Fix `event_bus.py` `None` sentinel to use `Optional[EventBus]` properly
10. **[MEDIUM]** Type the 4 `Any` parameters in `swarm.py` with concrete types
11. **[MEDIUM]** Add SHA256 checksum verification in `auto_updater.py` before `pip install`
12. **[MEDIUM]** Add security response headers to `raas-gateway/index.js`
13. **[LOW]** Generate and commit `package-lock.json` for both JS apps; enable `npm audit` in CI
14. **[LOW]** Replace prompt-injection regex filter in gateway with rate limiting + monitoring

---

## Metrics

| Check | Result |
|-------|--------|
| Hardcoded secrets | PASS — 0 found |
| `eval`/`exec` in business logic | PASS — 0 found |
| Unsafe `yaml.load()` | PASS — 0 found |
| Unsafe deserialization (pickle/marshal) | PASS — 0 found |
| `TODO`/`FIXME` in src/ | PASS — 0 found (only in verifier.py quality gate comments) |
| Token comparison (timing-safe) | FAIL — 2 violations |
| `shell=True` with user input | FAIL — 5 locations |
| Path traversal protection | FAIL — `file_agent.py` read/write |
| CORS configured | FAIL — not configured |
| Endpoint authentication | FAIL — ~20 unprotected |
| Telegram authorization | FAIL — no chat ID whitelist |
| File size <200 lines | FAIL — 11 files over limit |
| `any` type annotations | FAIL — 7 instances in business logic |
| `type: ignore` suppressions | WARNING — 8 instances |
| npm audit (openclaw-worker) | BLOCKED — no lockfile |
| npm audit (raas-gateway) | BLOCKED — no lockfile |
| Webhook HMAC signing (outbound) | PASS — correct implementation |
| Webhook HMAC verification (billing) | PASS — `compare_digest` used |
| Env vars for all secrets | PASS |
| Input validation (RaaS layer) | PASS — Pydantic + `_sanitize_goal` |

---

## Unresolved Questions

1. Is the gateway (`src/core/gateway.py`) exposed to the public internet, or only on `localhost`? If localhost-only, CRIT-1's blast radius is limited to local network. If internet-facing, it is a critical emergency.
2. `MEKONG_API_TOKEN` — what is the entropy/length of this token in production? A short token makes the timing attack (CRIT-3) and brute-force viable.
3. Does `.mekong/crashes/` get synced to any cloud storage or served by any endpoint? If yes, HIGH-4 escalates to CRITICAL.
4. Is `shell_agent.py` exposed via the Telegram bot (i.e., can a Telegram user trigger `ShellAgent` execution)? If yes, HIGH-1 is CRITICAL for that path.
5. The `auto_updater.py` `rollback()` installs from PyPI by version — is there a legitimate `mekong-cli` package on PyPI? If not, this could be squatted.
