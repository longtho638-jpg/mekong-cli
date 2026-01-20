# State Management Patterns

Standards for managing application state.

## Rules
- Use local `useState` for component-specific state.
- Use `useContext` for small, global state (e.g., theme, user session).
- For complex global state, use dedicated stores (e.g., Zustand, Redux Toolkit).
- Keep state as flat as possible; avoid deep nesting.
- Derive state whenever possible instead of duplicating it in multiple places.
- Use `useReducer` for complex state transitions.
