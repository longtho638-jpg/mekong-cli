# Installation Guide

Follow these steps to get your SaaS Admin Dashboard Pro up and running.

## Prerequisites

- **Node.js**: Version 18.17 or later.
- **npm**: Version 9 or later (or yarn/pnpm equivalent).

## Step-by-Step Setup

1.  **Unzip the Package**
    Extract the contents of `saas-admin-dashboard-pro-v1.0.0.zip` to your working directory.

2.  **Install Dependencies**
    Open your terminal, navigate to the project folder, and run:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Variables**
    Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
    *Note: Since this template uses mock data by default, you can start without configuring API keys. Update `.env.local` when you connect to real services.*

4.  **Start Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Building for Production

To create an optimized production build:

1.  **Build the project:**
    ```bash
    npm run build
    ```

2.  **Start production server:**
    ```bash
    npm start
    ```

## Troubleshooting

-   **Type Errors**: If you encounter TypeScript errors during build, ensure you are not using experimental features or conflicting types. The template is strict-mode compliant.
-   **Style Issues**: If styles are not loading, check if `registry.tsx` is correctly implemented in `src/theme/` (required for MUI with App Router).
