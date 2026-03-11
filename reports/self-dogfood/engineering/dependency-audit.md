# Engineering: Dependency Audit — Mekong CLI v5.0

## Command: /audit
## Date: 2026-03-11

---

## Source: pyproject.toml

Package: mekong-cli v5.0.0
Build system: Poetry + poetry-core
Python constraint: >=3.9,<3.13

---

## Production Dependencies

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| typer | >=0.12.0 | CLI framework | Low |
| rich | ^13.7.0 | Terminal formatting | Low |
| fastapi | ^0.109.0 | HTTP gateway | Low |
| uvicorn[standard] | ^0.27.0 | ASGI server | Low |
| pydantic | ^2.5.0 | Data validation | Low |
| email-validator | ^2.1.0 | Email validation | Low |
| stripe | ^7.10.0 | Payment processing | Medium |
| requests | ^2.31.0 | HTTP client | Low |
| python-dotenv | ^1.0.0 | Env file loading | Low |
| structlog | ^24.1.0 | Structured logging | Low |
| asyncpg | ^0.29.0 | PostgreSQL async driver | Low |
| python-jose[cryptography] | ^3.3.0 | JWT tokens | Medium |
| cryptography | ^41.0.0 | Crypto primitives | Low |
| pyjwt | ^2.8.0 | JWT encoding/decoding | Medium |
| python-multipart | ^0.0.6 | Form data parsing | Low |
| psutil | ^5.9.0 | Process/system metrics | Low |

### Optional Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| mem0ai | ^0.1.0 | Memory AI integration |
| qdrant-client | ^1.7.0 | Vector database |

---

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pytest | ^7.4.0 | Test runner |
| pytest-asyncio | ^0.21.1 | Async test support |
| pytest-cov | ^4.1.0 | Coverage reporting |
| black | ^23.12.0 | Code formatter |
| ruff | ^0.1.11 | Linter + formatter |
| mypy | ^1.8.0 | Static type checking |
| httpx | >=0.26.0,<0.28.0 | HTTP test client |

---

## Issues Found

### Issue 1: Duplicate JWT Libraries
Both `python-jose` and `pyjwt` are declared as production dependencies.
- `python-jose[cryptography]` — older, broader JWT/JWE support
- `pyjwt` — lighter, actively maintained, faster
These libraries overlap significantly. Having both increases attack surface and bundle size.
**Recommendation:** Pick one. `pyjwt` is preferred for modern usage. Remove `python-jose`.

### Issue 2: stripe v7 — Old Major Version
- stripe ^7.10.0 declared
- Stripe Python SDK current stable: v10+ (2025)
- v7 may lack newer Stripe features (e.g., Stripe Sessions v2, recent webhook events)
- **Recommendation:** Audit Stripe API usage and upgrade to ^10.0.0

### Issue 3: ruff Version Mismatch
- pyproject.toml dev: `ruff = "^0.1.11"`
- ci.yml installs: `"ruff>=0.9,<1.0"`
- 0.1.x vs 0.9.x is a significant version gap; linting rules differ between them
- CI may apply different rules than local dev
- **Recommendation:** Pin to same version range in both pyproject.toml and ci.yml

### Issue 4: black and ruff Both Declared
- `black ^23.12.0` and `ruff ^0.1.11` both in dev dependencies
- ruff includes a black-compatible formatter (`ruff format`)
- ci.yml only uses ruff format — black is never called in CI
- **Recommendation:** Remove `black`; use `ruff format` exclusively

### Issue 5: httpx Version Pinned Conservatively
- `httpx >=0.26.0,<0.28.0` in dev group
- httpx current: 0.27.x — within range, but upper bound blocks 0.28+
- ci.yml also pins `httpx<0.28` suggesting compatibility issue with 0.28
- **Recommendation:** Investigate what breaks at 0.28 and resolve; avoid indefinite upper pin

### Issue 6: asyncpg and No ORM
- `asyncpg ^0.29.0` provides raw async PostgreSQL
- No SQLAlchemy, tortoise-orm, or similar ORM declared
- Raw asyncpg requires manual query construction — higher SQL injection risk
- **Recommendation:** Add SQLAlchemy 2.x with async support or document why raw asyncpg is chosen

### Issue 7: mem0ai and qdrant-client as Optional
- Both are powerful but optional memory backends
- No documented install command for optional extras
- `pip install mekong-cli[memory]` extras group not defined
- **Recommendation:** Define `[tool.poetry.extras]` group named `memory`

---

## Security Concerns
- `python-jose[cryptography]` uses cryptography ^41.0.0 — pinned, not latest (44+)
- `requests ^2.31.0` — check for CVEs since 2.31 release
- No `safety` or `pip-audit` in CI pipeline for automated vulnerability scanning

---

## Build Dependencies
- `pyinstaller ^6.0.0` + `pyinstaller-hooks-contrib ^2024.0`
- Indicates binary distribution (`.exe`/app bundle) is planned
- pyinstaller is build-time only — no runtime risk

---

## Recommendations Summary
1. Remove `python-jose` — keep only `pyjwt`
2. Remove `black` — keep only `ruff` (format + check)
3. Upgrade `stripe` to ^10.0.0
4. Sync ruff version between pyproject.toml and ci.yml
5. Resolve httpx <0.28 upper bound
6. Add `[memory]` extras group for mem0ai + qdrant-client
7. Add `pip-audit` to CI for automated CVE scanning
