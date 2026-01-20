# Rollback Standards

Guidelines for reverting to a previous stable state in case of deployment failure.

## Rules
- Every deployment must have an automated or documented one-click rollback procedure.
- Trigger a rollback immediately if post-deployment health checks fail or critical errors are detected.
- Rollbacks must revert all components, including application code, configuration, and, if possible, database state.
- Post-rollback, perform a root cause analysis (RCA) to prevent the issue from recurring.
- Maintain at least the last three stable versions of artifacts for immediate rollback capability.
- Test the rollback procedure periodically in the staging environment.
- Notify all stakeholders immediately when a rollback is initiated.
