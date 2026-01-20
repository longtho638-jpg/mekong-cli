# Performance Metrics Standards

Guidelines for monitoring system performance.

## Rules
- Track the "Four Golden Signals": Latency, Traffic, Errors, and Saturation.
- Use percentiles (P50, P95, P99) instead of averages for latency monitoring.
- Set performance baselines for all critical API endpoints and user journeys.
- Monitor database query performance and identify slow queries.
- Use Distributed Tracing to identify bottlenecks in microservices architectures.
- Visualize metrics in real-time dashboards for operational visibility.
- Review performance trends weekly to identify gradual degradation.
