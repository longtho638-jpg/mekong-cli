# Environment Variables Standards

Guidelines for managing environment-specific configuration.

## Rules
- Never hardcode environment-specific values in the codebase.
- Use `.env.example` to document all required environment variables.
- Sensitive variables (API keys, passwords) must be stored in a secure secret manager, not in the CI/CD configuration.
- Use a consistent naming convention (e.g., `APP_PORT`, `DB_URL`) in uppercase.
- Validate the presence and format of required environment variables at application startup.
- Differentiate between build-time and run-time environment variables.
- Environment variables must be scoped to the appropriate environment (dev, staging, prod).
