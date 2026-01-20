# Integration Testing Standards

Guidelines for testing the interactions between different modules or services.

## Rules
- Focus on the boundaries between units and external systems.
- Use real databases or services when possible, or high-fidelity mocks/containers.
- Test data flow across multiple layers (e.g., API -> Service -> DB).
- Verify that components work together as expected under various conditions.
- Clean up test data after each test run to ensure isolation.
- Integration tests should be part of the CI pipeline but may run separately from unit tests if slow.
