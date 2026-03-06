---
title: "ROIaaS Phase 6 - Production Hardening"
description: "Input validation, trace ID logging, SBOM generation for production-grade CLI"
status: completed
priority: P1
effort: 8h
branch: master
tags: [roiaaS, production, security, validation, tracing, sbom]
created: 2026-03-07
completed: 2026-03-07
---

# ROIaaS Phase 6 - Production Hardening

## Context
- **Project**: mekong-cli
- **Existing**: Pydantic v2.5, structlog v24.1 configured
- **Gap**: No input validation decorators, no trace IDs, no SBOM
- **Goal**: Production-grade hardening for enterprise deployment

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Entry Point                          │
│                         main.py                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Input Validation Layer (NEW)                   │
│         @validate_input decorator + Pydantic models         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Trace ID Context (structlog)                     │
│         Generate per-command, propagate async calls         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Core Execution Engine                          │
│         planner → executor → verifier chain                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            SBOM Generation (Build Time)                     │
│         cyclonedx-cli → signed SBOM → artifact store        │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Pydantic Models Enhancement

### Existing Models Audit
- `src/core/gateway/models.py` - 15+ Pydantic models (CommandRequest, MissionResponse, etc.)
- `src/raas/mission_models.py` - MissionRecord, CreateMissionRequest
- **Gap**: No models for CLI commands, license payloads, config validation

### Tasks
- [ ] **Task 1.1**: Create `src/cli/command_models.py` with Pydantic models for:
  - `CookCommand` - goal, recipe, flags (verbose, dry_run, strict)
  - `PlanCommand` - goal, output_format
  - `LicenseGenerateCommand` - tier, email, org_name
  - `SwarmRegisterCommand` - node_name, host, port, token

- [ ] **Task 1.2**: Create `src/raas/license_models.py` for:
  - `LicenseKeyPayload` - decoded JWT claims (sub, tier, exp, features)
  - `LicenseValidationRequest` - key, tenant_id, feature
  - `LicenseValidationResponse` - valid, tier, features, error
  - `LicenseAuditLog` - timestamp, tenant_id, action, result, trace_id

- [ ] **Task 1.3**: Enhance `src/config.py` with Pydantic settings:
  - `CLIConfig` - inherits Pydantic BaseSettings
  - Field validators for paths, URLs, emails
  - Model validator for cross-field validation

**Success Criteria**:
- All public CLI commands have Pydantic input models
- License payloads use typed models, not raw dicts
- Config validation fails fast with clear error messages

---

## Phase 2: Input Validation Decorator

### Design
```python
@validate_input(
    goal=validators.not_empty(max_length=1000),
    recipe=validators.file_exists(),
    tier=validators.one_of(["free", "pro", "enterprise"])
)
def cook(goal: str, recipe: str | None = None, verbose: bool = False):
    ...
```

### Tasks
- [ ] **Task 2.1**: Create `src/cli/validation_decorator.py`:
  - `@validate_input(**field_rules)` decorator
  - Extract command args from Typer context
  - Run Pydantic validation before function execution
  - Raise `typer.Exit(code=1)` with Rich-formatted error on failure

- [ ] **Task 2.2**: Create `src/cli/validators.py` (enhance existing):
  - `not_empty(max_length: int)` - string length validation
  - `file_exists(check_readable: bool = True)` - path validation
  - `valid_email()` - RFC 5322 email format
  - `valid_url(require_https: bool = True)` - URL validation
  - `one_of(choices: list)` - enum validation
  - `license_key_format()` - validate RPP-/REP- prefix format

- [ ] **Task 2.3**: Apply decorator to all CLI commands:
  - `cook()`, `plan()`, `license generate`, `swarm register`
  - Update command docstrings with validation rules

- [ ] **Task 2.4**: Test validation failures:
  - Invalid goal (empty/too long)
  - Invalid recipe path (nonexistent file)
  - Invalid license key format
  - Invalid email in license generation

**Success Criteria**:
- All CLI commands reject invalid input with clear error messages
- Validation errors show field name, expected format, actual value
- No raw `sys.argv` parsing - all through Typer + Pydantic

---

## Phase 3: Trace ID Logging

### Design
```
Command Invocation → Generate UUID4 trace_id
                          │
                          ▼
              structlog.contextvars.bind_contextvars(
                  trace_id=trace_id,
                  command="cook",
                  tenant_id=xxx
              )
                          │
                          ▼
              All logs auto-include trace_id
              (planner, executor, verifier, agents)
```

### Tasks
- [ ] **Task 3.1**: Enhance `src/config/logging_config.py`:
  - Add `TraceIdGenerator` class using `uuid.uuid4()`
  - Add `add_trace_id()` processor to structlog pipeline
  - Add `bind_command_context(command, trace_id, tenant_id)` helper

- [ ] **Task 3.2**: Create `src/core/tracing.py`:
  - `TraceContext` dataclass (trace_id, span_id, parent_span_id)
  - `start_span(name: str, context: TraceContext)` → new span
  - `end_span(span_id: str)` → close span
  - `get_current_trace()` → return bound trace_id

- [ ] **Task 3.3**: Wire into CLI entry point (`src/main.py`):
  - In `main()` callback: generate trace_id, bind to context
  - Log command start: `logger.info("command.start", trace_id=...)`
  - Log command end: `logger.info("command.end", duration_ms=...)`

- [ ] **Task 3.4**: Propagate trace_id through async calls:
  - `planner.py` - add trace_id to LLM prompts
  - `executor.py` - include trace_id in shell command logs
  - `verifier.py` - log verification results with trace_id
  - `llm_client.py` - add trace_id to API request headers

- [ ] **Task 3.5**: Add trace_id to audit log (ROIaaS Phase 2):
  - `src/api/raas_billing_service.py` - include trace_id in billing events
  - `src/db/schema.py` - add `trace_id` column to `usage_events` table

**Success Criteria**:
- Every log line includes `trace_id` field
- Trace ID persists through entire Plan-Execute-Verify cycle
- Can query logs by trace_id to reconstruct full command execution

---

## Phase 4: SBOM Generation

### Tool Selection
- **cyclonedx-cli** - Python CLI for CycloneDX SBOM format
- **cosign** - Artifact signing (optional, for supply chain security)

### Tasks
- [ ] **Task 4.1**: Add dev dependencies to `pyproject.toml`:
  ```toml
  [tool.poetry.group.dev.dependencies]
  cyclonedx-cli = "^0.24.0"
  cyclonedx-python-lib = "^6.0.0"
  # Optional: cosign-python for signing
  ```

- [ ] **Task 4.2**: Create `scripts/generate-sbom.sh`:
  ```bash
  #!/bin/bash
  # Generate SBOM with cyclonedx-cli
  cyclonedx-py requirements \
    --output-format JSON \
    --output-file sbom.json \
    --without-dev-dependencies

  # Add metadata
  jq '.metadata.component.version = "'$(poetry version -s)'"' sbom.json > sbom-temp.json
  mv sbom-temp.json sbom.json

  echo "SBOM generated: sbom.json"
  ```

- [ ] **Task 4.3**: Create `scripts/sign-sbom.sh` (optional):
  ```bash
  #!/bin/bash
  # Sign SBOM with cosign (if available)
  if command -v cosign &> /dev/null; then
    cosign sign-blob --key $COSIGN_KEY sbom.json --output sbom.sig
    echo "SBOM signed: sbom.sig"
  else
    echo "⚠️  cosign not found - skipping signature"
  fi
  ```

- [ ] **Task 4.4**: Integrate into CI/CD (`.github/workflows/ci.yml`):
  - Run `generate-sbom.sh` after `poetry build`
  - Upload `sbom.json` as build artifact
  - Optional: Upload to dependency track (if configured)

- [ ] **Task 4.5**: Add SBOM to release process:
  - Include `sbom.json` + `sbom.sig` in GitHub releases
  - Add SBOM hash to release notes

**Success Criteria**:
- `scripts/generate-sbom.sh` produces valid CycloneDX 1.4 JSON
- SBOM includes all direct + transitive dependencies
- SBOM attached to every GitHub release artifact

---

## Phase 5: Testing

### Tasks
- [ ] **Task 5.1**: Test Pydantic models (`tests/test_command_models.py`):
  - Valid input passes validation
  - Invalid input raises `ValidationError` with clear message
  - Edge cases: empty strings, max length, special chars

- [ ] **Task 5.2**: Test validation decorator (`tests/test_validation_decorator.py`):
  - Decorator blocks invalid input
  - Error messages are Rich-formatted
  - Works with optional parameters

- [ ] **Task 5.3**: Test trace ID propagation (`tests/test_tracing.py`):
  - Trace ID generated per command
  - Trace ID appears in all log output
  - Trace ID persists through async calls

- [ ] **Task 5.4**: Test SBOM generation (`tests/test_sbom.py`):
  - SBOM JSON is valid CycloneDX schema
  - All dependencies included
  - Version metadata correct

- [ ] **Task 5.5**: Integration test (`tests/test_production_hardening.py`):
  - Run `mekong cook` with invalid input → blocked
  - Run with valid input → trace_id in logs
  - Verify SBOM generated in build artifacts

**Success Criteria**:
- All tests pass (pytest)
- Code coverage > 80% for new modules
- No regression in existing tests

---

## Success Criteria (Definition of Done)

- [ ] **Input Validation**: All CLI commands reject invalid input
- [ ] **Trace IDs**: Every log line includes trace_id
- [ ] **SBOM**: Build artifacts include signed SBOM
- [ ] **Tests**: All new tests pass, coverage > 80%
- [ ] **Docs**: Updated `docs/code-standards.md` with validation patterns
- [ ] **CI/CD**: GitHub Actions generates SBOM on every build

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to CLI API | High | Backward-compatible decorators, deprecation warnings |
| Performance overhead from tracing | Low | Async trace ID propagation, minimal sync operations |
| SBOM tooling compatibility | Medium | Pin cyclonedx-cli version, test in CI |
| Trace ID lost in async contexts | Medium | Use structlog contextvars (async-safe) |

---

## Next Steps

1. **Start with Phase 1** (Pydantic models) - foundation for all validation
2. **Phase 2** (decorators) depends on Phase 1 completion
3. **Phase 3** (tracing) can run parallel to Phase 2
4. **Phase 4** (SBOM) is independent - can do anytime
5. **Phase 5** (tests) after all implementation complete

---

## Related Files

### To Create
- `src/cli/command_models.py`
- `src/raas/license_models.py`
- `src/cli/validation_decorator.py`
- `src/core/tracing.py`
- `scripts/generate-sbom.sh`
- `scripts/sign-sbom.sh`

### To Modify
- `src/cli/validators.py` (enhance existing)
- `src/config/logging_config.py` (add trace_id)
- `src/config.py` (Pydantic settings)
- `src/main.py` (bind trace_id at entry)
- `pyproject.toml` (add cyclonedx-cli)
- `.github/workflows/ci.yml` (SBOM generation)

---

## Unresolved Questions

1. Should trace IDs be propagated to external API calls (e.g., LLM providers)?
2. Do we need to support multiple SBOM formats (CycloneDX + SPDX)?
3. Should validation errors be logged to audit log or just stderr?
4. Do we need a CLI command to view trace logs (`mekong trace <trace_id>`)?
