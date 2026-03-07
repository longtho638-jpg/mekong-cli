---
phase: 5
title: "Testing — Unit + Integration Tests"
status: pending
effort: 0.5h
---

# Phase 5: Testing

## Overview

Comprehensive tests for rate limiting functionality.

## Test Categories

1. **Unit Tests** — Token bucket algorithm
2. **Integration Tests** — Decorator + middleware
3. **E2E Tests** — Full request flow

## Test Plan

### Unit Tests (`tests/test_rate_limiter.py`)

```python
# Token bucket tests
def test_token_bucket_consumes_token()
def test_token_bucket_refuses_when_empty()
def test_token_bucket_refills_over_time()
def test_token_bucket_capacity_limit()

# Storage tests
def test_storage_creates_new_buckets()
def test_storage_cleanup_stale_entries()
def test_storage_thread_safety()
```

### Integration Tests (`tests/test_rate_limit_integration.py`)

```python
# Decorator tests
def test_rate_limit_decorator_allows_under_limit()
def test_rate_limit_decorator_blocks_over_limit()
def test_rate_limit_headers_present()
def test_rate_limit_bypass_ips()

# Middleware tests
def test_middleware_dev_mode_bypass()
def test_middleware_logs_violations()
```

### Route Tests (`tests/test_auth_routes_rate_limit.py`)

```python
# Per-endpoint tests
def test_login_route_5_per_minute()
def test_callback_route_10_per_minute()
def test_refresh_route_30_per_hour()
def test_dev_login_route_bypass()
```

## Implementation Steps

1. **Create unit test file** (`tests/test_rate_limiter.py`)
   - Test TokenBucket class
   - Test InMemoryStorage class

2. **Create integration test file** (`tests/test_rate_limit_integration.py`)
   - Test decorator behavior
   - Test middleware integration

3. **Create route test file** (`tests/test_auth_routes_rate_limit.py`)
   - Test each protected endpoint

4. **Run test suite**
   - `python3 -m pytest tests/test_rate_limiter*.py -v`

## Related Code Files

**Create:**
- `tests/test_rate_limiter.py`
- `tests/test_rate_limit_integration.py`
- `tests/test_auth_routes_rate_limit.py`

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All route tests pass
- [ ] Test coverage >90% for rate_limiter module
- [ ] Tests run in <30 seconds

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests flaky due to timing | Medium | Use mock time, not real sleep |
| Tests slow due to concurrency | Low | Limit concurrent test workers |
| False positives in CI | Low | Run tests multiple times if flaky |

## Unresolved Questions

1. Should we add performance benchmarks? (Future: add pytest-benchmark)
2. Should we test with Redis storage? (Future enhancement)
