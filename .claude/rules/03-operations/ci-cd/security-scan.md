# Security Scan Standards

Guidelines for automated security vulnerability scanning.

## Rules
- Perform Static Application Security Testing (SAST) on every PR.
- Scan dependencies for known vulnerabilities (e.g., Snyk, GitHub Dependency Check).
- Perform Secret Scanning to prevent accidental exposure of API keys and credentials.
- Container images must be scanned for OS and library vulnerabilities before deployment.
- High and Critical vulnerabilities must block the build and deployment.
- Regularly update scanning tools and vulnerability databases.
- Document and justify any security findings that are marked as "won't fix" or "false positive".
