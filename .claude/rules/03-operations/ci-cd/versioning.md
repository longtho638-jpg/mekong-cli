# Versioning Standards

Guidelines for versioning software and artifacts.

## Rules
- Follow Semantic Versioning (SemVer) 2.0.0: `MAJOR.MINOR.PATCH`.
- Increment `MAJOR` for incompatible API changes.
- Increment `MINOR` for added functionality in a backwards-compatible manner.
- Increment `PATCH` for backwards-compatible bug fixes.
- Use pre-release tags (e.g., `-alpha`, `-beta`, `-rc`) for testing versions.
- All artifacts (Docker images, packages) must be tagged with the version and git commit hash.
- Never reuse a version number once it has been released to production.
