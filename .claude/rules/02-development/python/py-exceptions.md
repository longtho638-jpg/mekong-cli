# Python Exception Handling

Standard patterns for error management in Python.

## Rules
- Catch specific exceptions instead of a bare `except:`.
- Use `try/except/finally` for resource cleanup (or use `with` statements).
- Raise custom exceptions for domain-specific errors.
- Include helpful error messages and context when raising exceptions.
- Log exceptions with `logging.exception()` to capture stack traces.
- Avoid suppressing exceptions unless there is a very good reason.
- Use the `raise from` syntax to preserve the original exception context (exception chaining).
