# E2E Testing Standards

Guidelines for end-to-end testing of the entire system.

## Rules
- Test critical user journeys from start to finish (e.g., signup to purchase).
- Use tools like `Playwright` or `Cypress` for web applications.
- Run E2E tests against a production-like environment (staging).
- Minimize the number of E2E tests to focus on high-value paths due to their execution cost.
- Ensure tests are resilient to minor UI changes by using stable selectors (e.g., `data-testid`).
- Automated E2E tests must pass before any production deployment.
