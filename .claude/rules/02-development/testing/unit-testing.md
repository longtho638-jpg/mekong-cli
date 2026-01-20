# Unit Testing Standards

Guidelines for writing effective unit tests in the Antigravity ecosystem.

## Rules
- Test small, isolated units of code (functions, methods, classes).
- Use `pytest` for Python and `vitest` or `jest` for TypeScript.
- Follow the Arrange-Act-Assert (AAA) pattern.
- Aim for high branch coverage within the unit.
- Keep tests fast and independent of external systems (DB, API).
- Use descriptive test names that explain the expected behavior.
- Ensure 100% pass rate before any commit.
