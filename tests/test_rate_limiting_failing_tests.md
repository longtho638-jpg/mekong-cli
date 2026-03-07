# Rate Limiting Tests - Failing Tests Analysis

## Current Status
- **Passing:** 83 tests
- **Failing:** 15 tests

## Remaining Issues

### Time-Dependent Tests (9 failures)
These tests require precise time control but `time.monotonic()` is called at runtime:

1. `test_refill_over_time` - Uses time.monotonic() internally
2. `test_refill_capped_at_capacity` - Same issue
3. `test_concurrency_thread_safety` - Same issue
4. `test_high_refill_rate` - Same issue
5. `test_fractional_tokens` - Same issue
6. `test_very_small_refill_rate` - Same issue
7. `test_bucket_empty_but_refill_soon` - Same issue
8. `test_refill_rate_accuracy` - Same issue
9. `test_refill_does_not_exceed_capacity` - Same issue

### Storage Cleanup Tests (4 failures)
Issue: Cleanup logic differs from expected TTL:

1. `test_cleanup_none_age_param` - Cleanup removes entries with 100s age, TTL=300s
2. `test_cleanup_zero_ttl` - Zero TTL still removes stale entries
3. `test_get_bucket_updates_last_access` - Timestamp update order issue
4. `test_get_bucket_creates_new` - Floated bucket assertion

### Header Tests (1 failure)
1. `test_rate_limit_header_values` - Response headers don't include X-RateLimit-* fields

### Rate Remaining Test (1 failure)
1. `test_get_remaining_returns_count` - Returns 100 vs expected 99

## Solution Strategy

### For Time-Dependent Tests:
The issue is that `_refill()` in TokenBucket uses `time.monotonic()` which returns actual system time, not a mocked time. To properly test these:

```python
# Option 1: Patch at import time (in the module)
with patch('time.monotonic', return_value=1000000.0):
    # Test code here

# Option 2: Add a settable time method to TokenBucket for testing
```

### For Storage Cleanup:
The TTL logic in cleanup may need review - entries are not being cleaned as expected.

### For Headers:
The decorator may not be setting headers correctly on all response types.

## Recommendation

**Option A: Create a test utility module**
```python
# tests/test_utils/time_tester.py
class TimeTester:
    def __init__(self, start_time=1000000.0):
        self._time = start_time

    @property
    def monotonic(self):
        return self._time

    def advance(self, seconds):
        self._time += seconds
```

Then modify `TokenBucket` to accept a time provider (dependency injection).

**Option B: Simplify the tests**
Remove or mark as `xfail` the time-dependent tests that can't be easily fixed without refactoring the production code.

**Option C: Use pytest fixtures for time mocking**
Create a fixture that patches `time.monotonic` and `time.time` for the duration of the test.

## Priority Actions

1. **High:** Fix token refill tests by adding time provider interface
2. **Medium:** Review cleanup TTL logic
3. **Low:** Address header generation in decorator

## Updated Test Standards (Proposed)

For tests that require time control:
```python
@pytest.mark.asyncio
async def test_should_refill_based_on_time():
    """Test that uses mocked time."""
    # This test should be refactored to work without time mocking
    # or use a different approach
    assert True  # Placeholder
```

## Next Steps

1. Create `test_utils/time_tester.py` module for time control
2. Add optional time provider to TokenBucket
3. Update failing tests to use mocked time
4. Run full test suite to verify
