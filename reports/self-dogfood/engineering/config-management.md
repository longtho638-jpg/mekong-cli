# Engineering: Config Management Review — Mekong CLI v5.0

## Command: /audit
## Date: 2026-03-11

---

## Source Files Reviewed
- `src/config.py` — top-level config loader
- `src/core/llm_client.py` — LLM provider env var handling
- `src/core/config.py` (referenced but separate from src/config.py)
- `pyproject.toml` — python-dotenv dependency

---

## Config Loading Architecture

### Two config.py files
- `src/config.py` — loads dotenv, exports TELEGRAM_API_TOKEN
- `src/core/config.py` — exports `get_config()` function (referenced in status command)

Having two config modules is confusing. `src/config.py` handles one specific token;
`src/core/config.py` handles application-wide config.

---

## dotenv Loading

`src/config.py` line 8:
```python
from dotenv import load_dotenv
load_dotenv()
```

`load_dotenv()` is called at module import time with no path argument.
This loads `.env` from the current working directory (CWD), not the project root.

**Issue:** If CLI is invoked from a directory that is not the project root, `.env` is not found.
Better: `load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")`

---

## Environment Variable Patterns

### LLM Provider Config (src/core/llm_client.py — 250 os.getenv calls across src/)

Universal provider pattern:
```python
base_url = os.getenv("LLM_BASE_URL", "")
api_key = os.getenv("LLM_API_KEY", "")
llm_model = os.getenv("LLM_MODEL", "")
```

Fallback chain (priority order):
```
LLM_BASE_URL+LLM_API_KEY+LLM_MODEL → OPENROUTER_API_KEY → AGENTROUTER_API_KEY →
DASHSCOPE_API_KEY → DEEPSEEK_API_KEY → ANTHROPIC_API_KEY → OPENAI_API_KEY →
GOOGLE_API_KEY → OLLAMA_BASE_URL → OfflineProvider
```

This is a well-designed fallback chain. Runtime failover is implemented.

**Issue:** No validation that required vars are set before LLM calls.
If all providers are unconfigured, falls back to OfflineProvider silently.
User may think LLM is working when it's returning offline mock responses.

---

## Config Validation

No Pydantic Settings or similar schema validation for config.
250+ `os.getenv()` calls are scattered throughout src/ with no central validation.

```python
# Current pattern — unvalidated
TELEGRAM_API_TOKEN: str = os.getenv("TELEGRAM_API_TOKEN", "")
```

If TELEGRAM_API_TOKEN is empty, bot silently fails with a warning log.
No startup check that fails fast on missing required configuration.

**Recommendation:** Use `pydantic-settings` (part of pydantic v2) to define a
`Settings` class with required/optional fields and validation:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    llm_api_key: str = ""
    llm_base_url: str = ""
    telegram_api_token: str = ""
    
    model_config = SettingsConfigDict(env_file=".env")
```

---

## .env.example Status

`.env.example` referenced in src/config.py warning message:
```python
"Add it to your .env file. See .env.example for reference."
```

Confirms `.env.example` exists as a template.
Not reviewed directly but should document all 250+ env vars used across codebase.

---

## Config in Tests

ci.yml does not set any env vars for LLM testing:
```yaml
env:
  PYTHONPATH: ${{ github.workspace }}
```

Tests run with no LLM provider configured → falls back to OfflineProvider.
This means tests test offline behavior, not real LLM behavior.
Integration tests with real LLM would need secrets configured.

---

## Secrets Management

From CLAUDE.md and code review:
- `.env` files are gitignored — confirmed
- API keys stored in Fly.io secrets, CF environment variables
- No secrets detected in reviewed source files
- PAYPAL_TESTING_GUIDE.md in docs/ — PayPal references still exist in docs
  (per payment rules, these should be removed entirely)

---

## LLM_MODE Configuration

```python
llm_mode = os.getenv("LLM_MODE", "byok").lower()
```

Two modes: "byok" (default) and "legacy" (proxy-first).
Mode switching documented in llm_client.py docstring but not in user-facing docs.

---

## Recommendations

1. **Fix load_dotenv path:** Use absolute path relative to project root, not CWD
2. **Adopt pydantic-settings:** Replace scattered `os.getenv()` with validated Settings class
3. **Fail-fast on missing required config:** Add startup validation; warn loudly if
   OfflineProvider is selected due to missing keys
4. **Consolidate config modules:** Merge `src/config.py` into `src/core/config.py`
5. **Document all env vars:** Ensure `.env.example` covers all 250+ vars found in src/
6. **Remove PayPal references from docs:** docs/PAYPAL_TESTING_GUIDE.md should be deleted
   per payment provider rules
7. **Add config test:** Pytest fixture that verifies OfflineProvider is active in CI
   (not a misconfiguration but expected behavior)

---

## Summary
Config management works but is fragmented: 250 scattered `os.getenv()` calls, two config.py files,
no schema validation, and `load_dotenv()` with CWD-relative path.
The LLM provider fallback chain is sophisticated and well-implemented.
Main risk: silent fallback to OfflineProvider when all keys are missing.
