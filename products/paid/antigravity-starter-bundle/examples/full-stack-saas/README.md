# Full Stack SaaS Example 🏗️

This example demonstrates how to run the AgencyOS Workspace (Frontend) alongside the Social Auth Kit and User Preferences Kit (Backends) to create a cohesive SaaS application.

## Architecture

*   **Frontend:** AgencyOS Workspace (Next.js) running on port `3000`.
*   **Auth Service:** Social Auth Kit (Express/Node) running on port `3001`.
*   **Preferences Service:** User Preferences Kit (Node) running on port `3002`.

## How to Run

We use `concurrently` to run all services at once for development.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Stack:**
    ```bash
    npm run dev
    ```

## Configuration

Ensure you have `.env` files set up in each product directory (`products/social-auth-kit`, `products/agencyos-workspace`, `products/user-preferences-kit`).

The Frontend is configured to proxy requests:
*   `/api/auth` -> `http://localhost:3001`
*   `/api/prefs` -> `http://localhost:3002`

## Code Highlights

Check `package.json` to see how we orchestrate the startup.
