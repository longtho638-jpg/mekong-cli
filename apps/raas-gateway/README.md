# raas-gateway

`raas-gateway` is a Cloudflare Worker project designed to act as a secure and scalable gateway, likely facilitating interactions with the Claude AI API or similar services. It provides a serverless interface for managing requests and responses, leveraging Cloudflare's edge network for performance and reliability.

## Table of Contents

*   [Features](#features)
*   [Project Structure](#project-structure)
*   [Prerequisites](#prerequisites)
*   [Installation](#installation)
*   [Configuration](#configuration)
*   [Usage](#usage)
*   [Deployment](#deployment)
*   [License](#license)

## Features

*   **Serverless Architecture:** Built on Cloudflare Workers for high availability, low latency, and automatic scaling.
*   **API Gateway:** Acts as an intermediary for external services, potentially integrating with AI models like Claude.
*   **Secure Secret Management:** Utilizes Cloudflare Worker secrets for handling sensitive API keys and configurations.
*   **Lightweight and Efficient:** Optimized for edge computing environments.

## Project Structure

The project is organized as follows:

*   `.claude`: Configuration file likely related to Claude AI integration.
*   `.dev.vars`: Environment variables for local development.
*   `CLAUDE.md`: Specific documentation pertaining to the Claude AI integration or usage.
*   `index.js`: The main entry point for the Cloudflare Worker, containing the core logic of the gateway.
*   `package.json`: Node.js project manifest, listing dependencies and project metadata.
*   `update_secret.sh`: A shell script to facilitate updating secrets for the Cloudflare Worker.
*   `wrangler.toml`: Configuration file for Cloudflare Workers, defining routes, environment variables, and other deployment settings.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [Cloudflare Account](https://www.cloudflare.com/)
*   [Cloudflare `wrangler` CLI](https://developers.cloudflare.com/workers/wrangler/install-update/)

    ```bash
    npm install -g wrangler
    ```

## Installation

To get the project up and running locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd raas-gateway
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

### Local Development

For local development, environment variables are managed in the `.dev.vars` file. Create this file in the project root and populate it with necessary key-value pairs (e.g., API keys).

Example `.dev.vars`:

```
CLAUDE_API_KEY="your_claude_api_key_here"
```

### Cloudflare Worker Secrets

For production deployments, sensitive information should be stored as Cloudflare Worker secrets. The `update_secret.sh` script is provided to help manage these secrets.

To set a secret:

```bash
./update_secret.sh CLAUDE_API_KEY "your_production_claude_api_key"
```

This script will use `wrangler secret put` to upload the secret to your Cloudflare Worker.

### Wrangler Configuration

The `wrangler.toml` file contains the main configuration for your Cloudflare Worker, including the worker's name, account ID, routes, and environment bindings. Review and adjust it as needed for your deployment.

## Usage

### Local Development

To run the worker locally for development and testing:

```bash
wrangler dev
```

This will start a local server, typically on `http://localhost:8787`, allowing you to test your worker's functionality.

### Interacting with the Gateway

Once deployed or running locally, you can interact with the gateway via HTTP requests. The specific endpoints and request formats will depend on the logic implemented in `index.js`. Refer to `CLAUDE.md` for details on Claude AI specific interactions.

## Deployment

To deploy your Cloudflare Worker to the Cloudflare edge network:

1.  **Authenticate Wrangler:**
    ```bash
    wrangler login
    ```
2.  **Deploy the worker:**
    ```bash
    wrangler deploy
    ```

Wrangler will build your project and deploy it to the Cloudflare Workers environment specified in `wrangler.toml`.

## License

This project is licensed under the ISC License. See the `package.json` file for more details.