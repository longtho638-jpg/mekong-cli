# Express.js Rate Limiter Example

This example demonstrates how to implement the same Redis-based Fixed Window rate limiting strategy used in the Python kit, but within a Node.js Express application.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Ensure Redis is running** (e.g., via Docker):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Run the server**:
   ```bash
   node index.js
   ```

4. **Test**:
   Visit `http://localhost:3001` refresh 6 times quickly to see the 429 error.
