# Docker Build Standards

Guidelines for creating Docker images.

## Rules
- Use official, minimal base images (e.g., `alpine`, `slim`).
- Multi-stage builds should be used to minimize the final image size.
- Do not run containers as `root`; create a dedicated non-privileged user.
- Explicitly set the `WORKDIR` and use `COPY` instead of `ADD`.
- Order `Dockerfile` instructions to optimize layer caching (e.g., copy dependency files first).
- Use `.dockerignore` to exclude unnecessary files from the build context.
- Tag images with the git commit SHA and semantic version.
