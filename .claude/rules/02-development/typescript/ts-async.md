# TypeScript Async Programming

Best practices for handling asynchronous operations.

## Rules
- Always use `async/await` syntax instead of raw `.then()` chains.
- Use `Promise.all()` or `Promise.allSettled()` for parallel execution of independent promises.
- Wrap async calls in `try/catch` blocks for robust error handling.
- Explicitly return `Promise<Type>` in function signatures for async functions.
- Avoid creating floating promises; always `await` or handle them explicitly.
- Use `AbortController` for cancellable async operations (e.g., fetch).
