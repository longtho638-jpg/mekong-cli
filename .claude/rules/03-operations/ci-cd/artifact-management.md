# Artifact Management Standards

Guidelines for storing and managing build artifacts.

## Rules
- All production-ready artifacts must be stored in a central registry (e.g., GitHub Packages, Docker Hub, AWS ECR).
- Artifacts must be immutable; once published, they should never be overwritten.
- Use clear and consistent naming conventions for all artifacts.
- Implement a retention policy to clean up old or unused artifacts.
- Ensure access to the artifact registry is properly secured and audited.
- Store build metadata (commit hash, build number, test results) alongside the artifact.
