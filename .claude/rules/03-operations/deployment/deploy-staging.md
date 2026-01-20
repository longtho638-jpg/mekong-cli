# Staging Deployment Standards

Guidelines for deploying to the staging environment.

## Rules
- The staging environment must be a near-identical mirror of production.
- All deployments to staging must be automated via the CI/CD pipeline.
- Staging must use isolated data sources; never connect staging to production databases.
- Perform automated smoke tests immediately after deployment to verify core functionality.
- Staging is the final gate for manual QA and stakeholder review before production.
- Use feature flags to control the visibility of new features in staging.
- Automatically tear down or reset staging environments for ephemeral or PR-based previews.
