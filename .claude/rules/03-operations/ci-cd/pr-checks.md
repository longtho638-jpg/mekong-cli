# PR Checks Standards

Mandatory checks that must pass before a Pull Request can be merged.

## Rules
- All automated tests (unit, integration) must pass.
- Linting and static analysis (e.g., ESLint, Flake8, Mypy) must pass with zero errors.
- Code coverage must not decrease below the established threshold.
- At least one approved code review from a designated reviewer is required.
- Build process must complete successfully for all target platforms.
- Security scans must not report any high or critical vulnerabilities.
- PR title and description must follow the project's contribution guidelines.
