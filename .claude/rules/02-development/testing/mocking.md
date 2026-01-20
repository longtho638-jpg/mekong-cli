# Mocking Guidelines

Best practices for using mocks, stubs, and spies in tests.

## Rules
- Mock external dependencies (APIs, third-party libraries) to ensure test stability and speed.
- Avoid over-mocking; if a unit is too hard to test without many mocks, consider refactoring it.
- Use standard mocking libraries (e.g., `unittest.mock` in Python, `vi.mock` in Vitest).
- Verify mock interactions (e.g., "was this function called with these arguments?").
- Prefer using "fakes" or "stubs" for complex data dependencies.
- Ensure mocks accurately reflect the behavior and signature of the real objects.
