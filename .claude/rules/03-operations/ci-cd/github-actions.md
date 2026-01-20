# GitHub Actions Standards

Guidelines for creating and maintaining GitHub Actions workflows.

## Rules
- Use versioned actions (e.g., `actions/checkout@v4`) instead of `master` or `main`.
- Keep workflow files modular and use reusable workflows or actions for common tasks.
- Use `secrets` for sensitive information and `vars` for non-sensitive configuration.
- Implement concurrency control to avoid multiple runs of the same workflow on the same branch.
- Use `if` conditions to limit workflow execution to relevant branches or events.
- Add descriptive names to jobs and steps for easier debugging.
- Regularly audit and update action versions to incorporate security patches and improvements.
