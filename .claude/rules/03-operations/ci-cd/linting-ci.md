# Linting in CI Standards

Guidelines for automated linting and code style enforcement.

## Rules
- Linting must be an integral part of the CI pipeline.
- Use project-standard configuration files (e.g., `.eslintrc`, `.prettierrc`, `pyproject.toml`).
- All linting errors must be resolved; warnings should be minimized.
- Automated code formatting (e.g., Prettier, Black) should be run as part of the pipeline or pre-commit hooks.
- Linting failures must block the PR merge.
- Use specialized linters for specific technologies (e.g., ShellCheck for bash, Hadolint for Dockerfiles).
