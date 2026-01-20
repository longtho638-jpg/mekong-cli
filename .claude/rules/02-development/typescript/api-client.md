# API Client Guidelines

Standards for interacting with backend services.

## Rules
- Centralize API calls in a dedicated client module (e.g., `src/api/`).
- Use `TanStack Query` (React Query) for data fetching, caching, and synchronization.
- Define request and response types for all API endpoints.
- Include authentication headers automatically using interceptors.
- Implement retry logic and timeout handling for network requests.
- Log all API errors to a central monitoring service.
