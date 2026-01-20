# Blue-Green Deployment Standards

Guidelines for zero-downtime blue-green deployment strategy.

## Rules
- Maintain two identical production environments: "Blue" (current) and "Green" (new).
- Deploy the new version to the idle environment (Green) and perform final validation.
- Switch traffic from Blue to Green at the load balancer level once Green is verified.
- Keep the Blue environment active for a short period after the switch to allow for near-instant rollback.
- Ensure database schema changes are backwards-compatible to support both environments during the transition.
- Automate the environment provisioning and traffic switching process.
- Regularly rotate which environment is "active" to ensure parity and prevent drift.
