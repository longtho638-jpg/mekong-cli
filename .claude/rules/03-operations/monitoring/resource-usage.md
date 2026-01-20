# Resource Usage Standards

Guidelines for monitoring and optimizing hardware and cloud resource consumption.

## Rules
- Track CPU, Memory, Disk, and Network usage for all services.
- Set alerts for resource saturation (e.g., disk usage > 80%).
- Monitor cloud costs and identify underutilized or oversized resources.
- Use auto-scaling to match resource provision with actual demand.
- Implement resource limits and quotas (e.g., Docker/K8s limits) to prevent "noisy neighbor" issues.
- Profile application memory usage to detect and fix leaks.
- Regularly review and optimize resource allocation to balance performance and cost.
