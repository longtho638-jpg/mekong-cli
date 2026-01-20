# Canary Deployment Standards

Guidelines for phased canary deployment strategy.

## Rules
- Deploy the new version to a small subset of servers or users (the "canaries") first.
- Monitor canary performance and error rates against the baseline (production) version.
- Automatically roll back if canary metrics exceed pre-defined error thresholds.
- Gradually increase the traffic percentage to the new version if metrics remain healthy.
- Use load balancer weights or header-based routing to control canary traffic.
- Canary deployments are preferred for high-traffic services where risk mitigation is critical.
- Ensure logging and monitoring can distinguish between canary and baseline traffic.
