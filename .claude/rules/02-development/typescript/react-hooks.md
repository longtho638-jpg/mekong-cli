# React Hooks Guidelines

Best practices for using and creating React hooks.

## Rules
- Follow the "Rules of Hooks" (no hooks in loops, conditions, or nested functions).
- Extract complex logic into custom hooks (e.g., `useUserSession`, `useDataFetch`).
- Use `useCallback` and `useMemo` sparingly, only for expensive operations or to maintain referential identity.
- Prefix custom hooks with `use`.
- Ensure hooks are properly typed, including return values and dependency arrays.
- Avoid side effects in the render body; use `useEffect` or event handlers.
