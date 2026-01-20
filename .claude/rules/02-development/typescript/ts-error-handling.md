# TypeScript Error Handling

Standard patterns for error management.

## Rules
- Use custom error classes that extend `Error` for domain-specific failures.
- Throw errors early (fail-fast) and handle them at the appropriate layer.
- Ensure all caught errors are properly logged with context before being re-thrown or suppressed.
- Use `instanceof` to distinguish between different error types in catch blocks.
- Never use empty catch blocks; at least log the error.
- Provide user-friendly error messages while keeping technical details in internal logs.
