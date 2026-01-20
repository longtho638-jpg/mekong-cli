# Error Tracking Standards

Guidelines for identifying and managing application errors.

## Rules
- Use an automated error tracking tool (e.g., Sentry, Rollbar).
- Group similar errors automatically to reduce noise and identify recurring issues.
- Configure alerts for new or high-frequency errors.
- Ensure error reports include stack traces, breadcrumbs, and environment metadata.
- Assign ownership to errors and track them until resolution.
- Monitor "error budgets" to balance feature velocity with system stability.
- Regularly review top errors and prioritize fixes based on user impact.
