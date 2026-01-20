# Test Coverage Standards

Guidelines for measuring and maintaining test coverage.

## Rules
- Aim for at least 80% overall code coverage.
- Critical business logic and security-sensitive code must have 100% coverage.
- Use coverage reports to identify untested paths, not just as a metric to chase.
- Integrate coverage checks into the CI/CD pipeline; fail builds if coverage drops below the threshold.
- Exclude boilerplate, configuration, and auto-generated code from coverage metrics.
- Regularly review coverage reports to ensure meaningful tests are being written.
