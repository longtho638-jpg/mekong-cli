# Production Deployment Standards

Guidelines for deploying to the production environment.

## Rules
- All production deployments require a successful staging run and manual approval.
- Deployments must be performed during designated maintenance windows or use zero-downtime strategies.
- Ensure a rollback plan is verified and ready before initiating deployment.
- Production deployments must be tagged in version control and logged in the changelog.
- Monitor system health (error rates, latency, resource usage) intensely for at least 30 minutes post-deployment.
- Use a "lock" mechanism to prevent concurrent deployments to production.
- Only artifacts that have passed all CI checks and staging validation can be deployed to production.
