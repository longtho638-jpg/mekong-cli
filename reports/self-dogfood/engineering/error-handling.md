# Engineering: Error Handling Analysis — Mekong CLI v5.0

## Command: /debug
## Date: 2026-03-11

---

## Analysis Scope
Grepped try/except patterns across src/core/ focusing on:
- orchestrator.py (20 except clauses)
- executor.py (6 except clauses)
- planner.py (2 except clauses)
- gateway.py error responses

---

## Patterns Found

### Pattern 1: Silent Exception Swallowing (Anti-Pattern)
```python
# orchestrator.py ~line 143
try:
    reflection_hint = self._reflection.get_strategy_suggestion(...)
except Exception:
    pass
```
Swallows any exception silently. If reflection module crashes, the failure is invisible.
No logging, no metrics increment.

### Pattern 2: Bare Exception Catch with Generic Log
```python
# orchestrator.py multiple sites
except Exception as e:
    logger.warning("Self-healing failed: %s", e)
```
Better than `pass` but still catches all exceptions including SystemExit, KeyboardInterrupt.
Should use `except Exception as e:` (already done) but should NOT catch OSError/MemoryError
without re-raising.

### Pattern 3: Specific Exception Type in executor.py
```python
# executor.py line 408
except subprocess.CalledProcessError as e:
    ...
# executor.py line 178
except req.exceptions.RequestException as e:
    ...
```
Correct pattern — specific exception types for specific error conditions.
`subprocess.CalledProcessError` and `requests.exceptions.RequestException` are both appropriate.

### Pattern 4: planner.py Exception with logger.exception
```python
# planner.py line 425-426
except Exception as e:
    logger.exception("[PLANNER] LLM decomposition failed: %s", e)
```
`logger.exception()` correctly captures stack trace. Good pattern.
However, after logging, the exception is silently swallowed — planner returns partial result.
Should either re-raise or return explicit error state.

### Pattern 5: gateway.py HTTPException Pattern
```python
# gateway.py
raise HTTPException(status_code=404, detail="Mission not found")
raise HTTPException(status_code=402, detail=result.error)
raise HTTPException(status_code=400, detail=f"Invalid complexity: ...")
raise HTTPException(status_code=401, detail="Missing X-API-Key header")
```
All HTTP error cases use FastAPI HTTPException correctly. Good.
402 on zero balance is semantically correct per HTTP spec.

---

## Exception Hierarchy Issues

### Missing: Domain Exception Classes
src/core/exceptions.py exists but no custom exception types are imported
in orchestrator.py, executor.py, or planner.py.
All exceptions raised are generic Python built-ins or library exceptions.

The exceptions.py module defines domain errors (likely MekongError, BillingError, etc.)
but core execution pipeline does not use them.

**Impact:** Callers cannot distinguish "step failed due to shell error" from
"step failed due to LLM error" from "step failed due to network error" — all surface
as generic `Exception`.

### Missing: Retry on Specific Errors Only
RetryPolicy is imported in orchestrator.py but should only retry on transient errors
(network timeouts, rate limits) not on logic errors (invalid command, file not found).
Without typed exceptions, RetryPolicy cannot discriminate.

---

## Error Propagation Chain

```
executor.execute_step()
  └── _execute_shell_step()
        └── subprocess.run() → CalledProcessError caught, returns ExecutionResult(exit_code=1)
              
orchestrator.StepExecutor.execute_and_verify()
  └── executor.execute_step() → result
  └── if exit_code != 0 and llm_client: attempt self-healing
  └── verifier.verify(result) → VerificationReport
  
RecipeOrchestrator.run()
  └── step_executor.execute_and_verify()
  └── if not verification.passed: attempt rollback
```

The chain is well-structured but the conversion from exception to ExecutionResult
at the executor level loses exception type information. By the time the orchestrator
sees a failure, it only knows `exit_code=1` and `stderr` string.

---

## Count Summary

| File | try blocks | except Exception | specific excepts | except: pass |
|------|------------|-----------------|-----------------|--------------|
| orchestrator.py | ~18 | 8 | 4 | 2 |
| executor.py | 5 | 2 | 3 | 0 |
| planner.py | 1 | 1 | 0 | 0 |
| gateway.py | 1 | 0 | 0 | 0 |

---

## Recommendations

1. **Create domain exceptions:** Define and USE `MekongExecutionError`, `PlanningError`,
   `LLMError` from exceptions.py in core pipeline
2. **Remove `except: pass`:** Replace 2 silent swallows in orchestrator.py with `logger.warning`
   at minimum; add metric counters
3. **Add --debug flag to CLI:** When set, raise exceptions instead of swallowing;
   surface full tracebacks to developers
4. **Type-discriminated retries:** RetryPolicy should only retry on TransientError subclasses,
   not all exceptions
5. **Planner re-raise or explicit error return:** After `logger.exception`, either re-raise
   or return `PlanningResult(success=False, error=str(e))`
6. **Add exception monitoring hook:** In exception handlers, emit to Sentry/telemetry
   before logging — currently no exception tracking in error paths
