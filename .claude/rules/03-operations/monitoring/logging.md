# Logging Standards

Guidelines for application logging and observability.

## Rules
- Use structured logging (JSON) to facilitate automated parsing and analysis.
- Include correlation IDs in all logs to track requests across distributed services.
- Categorize logs by severity level: DEBUG, INFO, WARNING, ERROR, CRITICAL.
- Never log sensitive information (PII, passwords, secrets).
- Ensure logs include relevant context (user ID, request path, timestamp, environment).
- Centralize logs in a searchable platform (e.g., ELK stack, Datadog, CloudWatch).
- Implement log retention and rotation policies to manage storage costs.
